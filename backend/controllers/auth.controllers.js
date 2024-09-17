import bcrypt from 'bcryptjs';
import User from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../lib/utils/generateTokenAndSetCookie.js";

export const signup = async (req, res) => {
  try {
    const {fullName, username, email, password} = req.body;

    // email format using ReGex(정규표현식)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    if(!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    };
    // 유저이름 체크
    const existingUser = await User.findOne({ username });
		if (existingUser) {
			return res.status(400).json({ error: "someone is using" });
		};
    // 유저메일 체크
		const existingEmail = await User.findOne({ email });
		if (existingEmail) {
			return res.status(400).json({ error: "Email already exist" });
		};

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
  
}

export const logout = async (req, res) => {
  
}