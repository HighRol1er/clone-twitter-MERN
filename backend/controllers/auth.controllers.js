import { generateTokenAndSetCookie } from "../lib/utils/generateTokenAndSetCookie.js";
import User from "../models/user.model.js";
import bcrypt from 'bcryptjs';

export const signup = async (req, res) => {
  try {
    const {fullName, username, email, password} = req.body;

    console.log("Request body:", req.body);
    console.log("Received password:", password);

    // email format using ReGex(정규표현식)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    if(!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    };
    // 유저이름 체크
    const existingUser = await User.findOne({ username });
		if (existingUser) {
			return res.status(400).json({ error: `someone is using ${username}` });
		};
    // 유저메일 체크
		const existingEmail = await User.findOne({ email });
		if (existingEmail) {
			return res.status(400).json({ error: "Email already exist" });
		};

    if(!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // db에 저장할 유저를 생성하고 할당
    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
    });

    // 유저가 성공적으로 생성된 후 클라이언트에게 전송할 데이터를 정의
    if(newUser){
      generateTokenAndSetCookie(newUser._id, res);
      await newUser.save();
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        followers: newUser.followers,
        following: newUser.following,
        profileImg: newUser.profileImg,
        coverImg: newUser.coverImg,
      });
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ error: "Server Error " });
  }
}

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({username});
    const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

    if(!user || !isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    generateTokenAndSetCookie(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      followers: user.followers,
      following: user.following,
      profileImg: user.profileImg,
      coverImg: user.coverImg,
    });
    
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ error: "Server Error " });
  }
}

export const logout = async (req, res) => {
  try {
		res.cookie("jwt", "", { maxAge: 0 });
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ error: "Server Error" });
	}
}

export const authCheck = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    console.log("Error in authCheck controller", error.message);
    res.status(500).json({ error: "Server Error" })
  }
}