const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const { DBconnection } = require("./database/db");


//db schema
const User = require('./model/User');
const Task = require('./model/Task');


dotenv.config();
DBconnection();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


//Authentication Middleware
const authenticateUser = async (req, res, next) => {
    try {
      const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).send('Authentication required');
      }
  
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      const user = await User.findById(decoded.id);
  
      if (!user) {
        return res.status(401).send('User not found');
      }
  
      req.user = user;
      next();
    } catch (error) {
      console.error(error.message);
      res.status(401).send('Invalid token');
    }
  };
  
  

  app.use('/tasks', authenticateUser);

app.get("/", (req,res) => {
    
    res.send("Hello");
});


app.post("/register", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    if (!(fullname && email && password)) {
      return res.status(400).send("Please enter all the details");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await User.create({
      fullname,
      
      email,
      password: hashedPassword,
    });

    return res.status(200).json({
      message: "User successfully created",
      user,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      return res.status(400).send("Please enter all the data");
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send("User not found");
    }

    const enteredPassword = await bcrypt.compare(password, user.password);

    if (!enteredPassword) {
      return res.status(400).send("Wrong password");
    }

    const token = jwt.sign({ id: user._id, email, fullname: user.fullname }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    const options = {
      expires: new Date(Date.now() + 12460601000),
      httpOnly: true,
    };

    user.password = undefined;

    

    res.status(200).cookie("token", token, options).json({
      message: "User logged in successfully",
      token,
      
      
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});


// Create Task API
app.post('/tasks', async (req, res) => {
    try {
      const { title, description, status, priority, deadline } = req.body;
      const userId = req.user.id; // Assuming you have middleware to extract user from token
  
      const task = await Task.create({
        title,
        description,
        status,
        priority,
        deadline,
        user: userId
      });
  
      res.status(201).json({
        message: 'Task created successfully',
        task
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  });

  // Edit Task API
app.put('/tasks/:id', async (req, res) => {
    try {
      const { title, description, status, priority, deadline } = req.body;
      const taskId = req.params.id;
      const userId = req.user.id; // Assuming you have middleware to extract user from token
  
      let task = await Task.findOne({ _id: taskId, user: userId });
  
      if (!task) {
        return res.status(404).send('Task not found or unauthorized');
      }
  
      task = await Task.findByIdAndUpdate(taskId, {
        title,
        description,
        status,
        priority,
        deadline
      }, { new: true });
  
      res.status(200).json({
        message: 'Task updated successfully',
        task
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  });
  
  // Delete Task API
  app.delete('/tasks/:id', async (req, res) => {
    try {
      const taskId = req.params.id;
      const userId = req.user.id; // Assuming you have middleware to extract user from token
  
      const task = await Task.findOne({ _id: taskId, user: userId });
  
      if (!task) {
        return res.status(404).send('Task not found or unauthorized');
      }
  
      await Task.findByIdAndDelete(taskId);
  
      res.status(200).json({
        message: 'Task deleted successfully'
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  });

// Fetch User's Tasks API
app.get('/tasks', authenticateUser, async (req, res) => {
    try {
      const userId = req.user.id;
      const tasks = await Task.find({ user: userId });
  
      res.status(200).json({
        message: 'Tasks fetched successfully',
        tasks
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  });

  // Create Task API for 'To Do' status
app.post('/tasks/todo', authenticateUser, async (req, res) => {
  try {
    const { title, description, priority, deadline } = req.body;
    const userId = req.user.id;

    const task = await Task.create({
      title,
      description,
      status: 'To Do',
      priority,
      deadline,
      user: userId
    });

    res.status(201).json({
      message: 'Task created successfully in To Do',
      task
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Create Task API for 'In Progress' status
app.post('/tasks/inprogress', authenticateUser, async (req, res) => {
  try {
    const { title, description, priority, deadline } = req.body;
    const userId = req.user.id;

    const task = await Task.create({
      title,
      description,
      status: 'In Progress',
      priority,
      deadline,
      user: userId
    });

    res.status(201).json({
      message: 'Task created successfully in In Progress',
      task
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Create Task API for 'Under Review' status
app.post('/tasks/underreview', authenticateUser, async (req, res) => {
  try {
    const { title, description, priority, deadline } = req.body;
    const userId = req.user.id;

    const task = await Task.create({
      title,
      description,
      status: 'Under Review',
      priority,
      deadline,
      user: userId
    });

    res.status(201).json({
      message: 'Task created successfully in Under Review',
      task
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Create Task API for 'Finished' status
app.post('/tasks/finished', authenticateUser, async (req, res) => {
  try {
    const { title, description, priority, deadline } = req.body;
    const userId = req.user.id;

    const task = await Task.create({
      title,
      description,
      status: 'Finished',
      priority,
      deadline,
      user: userId
    });

    res.status(201).json({
      message: 'Task created successfully in Finished',
      task
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

  


  app.listen(process.env.PORT, () => {
    console.log(`Listening on ${process.env.PORT}`);
  });