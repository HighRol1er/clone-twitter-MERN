import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

export const getUserProfile = async (req, res) => {
  const {username} = req.params;

  try {
    const user = await User.findOne({username}).select("-password");
    if(!user) {
      return res.status(404).json({ message : "User not found" });
    }
    res.status(200).json(user);
    
  } catch (error) {
    console.log("Error in getUserProfile", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const followOrUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToFollowOrUnFollow = await User.findById(id);

    // 현재 로그인한 유저
    const currentUser = await User.findById(req.user._id);

    // 셀프 팔로잉 금지 
    if(id === req.user._id.toString()) {
      return res.status(400).json({ message : "You can't follow/unfollow yourself "});
    }

    if(!userToFollowOrUnFollow || !currentUser) {
      return res.status(400).json({ error: "User not found"});
    }
    // 팔로우할 유저를 이미 팔로우 하고 있는지 확인
    const isFollowing = currentUser.following.includes(id); //true or false 반환

    // 팔로우 할 유저가 이미 팔로우 되어 있다면 unfollow 아니라면 follow하는 로직
    if(isFollowing){
      // unfollow 
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } }); //req.user._id : 현재 로그인한 사용자의 id
			await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

      // TODO: retrun the id of the user as a response
			res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      // follow
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id }});
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id }});
      
      // Send notification to the user
      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: userToFollowOrUnFollow._id,
      });

      await newNotification.save();
      // TODO: retrun the id of the user as a response
      res.status(200).json({ message: "User followed successfully" });
    }
  } catch (error) {
    console.log("Error in followUnfollowUser", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("current User ID :", userId);
    const userFollowedByMe = await User.findById(userId).select("following");
    
    // MongoDB 집계 함수
    const users = await User.aggregate([
      {
        $match: { 
          _id: { $ne: userId},
        },
      },
      { $sample: { size: 10 } },
      {
        $project: { password: 0 }, // 93줄 대신 사용, password field 제거
      }
    ]);
    
    // filter out the users I'm already following
    const filteredUser = users.filter((user) => !userFollowedByMe.following.includes(user._id));
    
    // 배열에는 10명의 무작위 사용자가 있지만 4명만 추출.
    const suggestedUsers = filteredUser.slice(0,4);

    // 사용자의 패스워드를 노출시키지 않기 위한 로직인데 아예 p.w를 반환하지 않게 미리 작업해두면 좋음 
    // suggestedUsers.forEach((user) => (user.password = null));
    
    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log("Error in getSuggestedUser", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { fullName, email, username, currentPassword, newPassword, bio, link} = req.body;
  let { profileImg, coverImg } =req.body;

  const userId = req.user._id;

  try {
    let user = await User.findById(userId);
    if(!user) {
      return res.status(400).json({ message: "User not found" });
    }
    // change password
    if((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
      return res.status(400).json({ error: "Please provide both current password and new pasword" });
    }

    if(currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if(!isMatch) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      if(newPassword.length < 6) {
        return res.status(400).json({ error: "Password is too short" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // change profile & coverImg using cloudinary
    if(profileImg) {
      if(user.profileImg) {
        /*
         *NOTE: http://cloudinary/v2/image/exampleofimg.png 
         * 1. split("/") : [cloudinary, v2, image, exampleofimg.png] "/"를 기준으로 나눔
         * 2. pop() : [exampleofimg.png] : 배열 마지막 요소 꺼내서 새로운 배열로*
         * 3. split(".") : [exampleofimg, png] 
         * 4. [0] : exampleofimg  : img id만 추출해낼 수 있다.  
         */ 
        await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
      }

      const uploadedResponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedResponse.secure_url;
    }

    if(coverImg) {
      if(user.coverImg) {
        await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
      }

      const uploadedResponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedResponse.secure_url;
    }

    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    user = await user.save();

    // password is null in response
    user.password = null;

    return res.status(200).json(user);

  } catch (error) {
    console.log("Error in updateUser", error.mesaage);
    res.status(500).json({ error: error.message });
  }

}