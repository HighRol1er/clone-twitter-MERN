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
}

export const getSuggestedUsers = async (req, res) => {
  try {
    
  } catch (error) {
    
  }
}