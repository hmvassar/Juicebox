require("dotenv").config();

const express = require("express");
const usersRouter = express.Router();

const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

const { createUser, getAllUsers, getUserByUsername } = require("../db");

usersRouter.get("/", async (req, res) => {
  console.log("Users.get");
  const users = await getAllUsers();

  res.send({
    users,
  });
});

usersRouter.post("/login", async (req, res, next) => {
  const { username, password } = req.body;

  // request must have both
  if (!username || !password) {
    next({
      name: "MissingCredentialsError",
      message: "Please supply both a username and password",
    });
  }

  try {
    const user = await getUserByUsername(username);

    if (user && user.password == password) {
      // Create secret token and display successful login message
      let token = jwt.sign(user, process.env.JWT_SECRET);
      res.send({ message: "SUCCESSFULLY logged in!", token });
    } else {
      next({
        name: "IncorrectCredentialsError",
        message: "LOGIN FAILED: Username or password is incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

usersRouter.post("/register", async (req, res, next) => {
  const { username, password, name, location } = req.body;

  try {
    const _user = await getUserByUsername(username);

    if (_user) {
      next({
        name: "UserExistsError",
        message: "A user by that username already exists",
      });
    }

    const user = await createUser({
      username,
      password,
      name,
      location,
    });

    const token = jwt.sign(
      {
        id: user.id,
        username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.send({
      message: "SUCCESSFULLY registered!",
      token,
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = usersRouter;