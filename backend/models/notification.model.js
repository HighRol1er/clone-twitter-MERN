import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  from:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type:{
    type: String,
    required: true,
    enum: ['follow', 'like'] //'comment', 'reply'기능도 추가할 수 있음 하자
  },
  read:{
    type: Boolean,
    default: false,
  }
},{timestamps: true});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;