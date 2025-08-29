import { Business, User } from "../models/user.model.js";
import { Activity } from "../models/activity.model.js";
import { Review } from "../models/review.model.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-password -verificationToken -resetPasswordToken")
      .populate("recentActivities")
      .populate({
        path: "reviews",
        populate: {
          path: "reviewer",
          select: "username profilePhoto",
        },
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProfileByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("-password -verificationToken -resetPasswordToken")
      .populate({
        path: "recentActivities",
        match: {
          date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }, // Last 30 days
        options: { sort: { date: -1 }, limit: 6 },
      })
      .populate({
        path: "reviews",
        populate: {
          path: "reviewer",
          select: "username profilePhoto",
        },
        options: { sort: { date: -1 } },
      })
      .populate("followers", "username profilePhoto")
      .populate("following", "username profilePhoto");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get fresh counts to ensure they're accurate
    const freshCounts = await User.findById(user._id).select(
      "followersCount followingCount"
    );

    user.followersCount = freshCounts.followersCount;
    user.followingCount = freshCounts.followingCount;

    res.json(user);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const restrictedFields = [
      "password",
      "verificationToken",
      "resetPasswordToken",
    ];
    const updateData = {};

    Object.keys(req.body).forEach((key) => {
      if (!restrictedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    if (req.file) {
      const user = await User.findById(userId);

      if (user?.profilePhoto?.public_id) {
        await cloudinary.uploader.destroy(user.profilePhoto.public_id);
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_photos",
        width: 500,
        height: 500,
        crop: "fill",
        gravity: "face",
      });

      updateData.profilePhoto = {
        public_id: result.public_id,
        url: result.secure_url,
      };

      fs.unlinkSync(req.file.path);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password -verificationToken -resetPasswordToken");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateBusiness = async (req, res) => {
  try {
    const userId = req.userId;
    const businessId = req.params.id;

    const restrictedFields = ["userId", "_id", "createdAt"];
    const updateData = {};

    Object.keys(req.body).forEach((key) => {
      if (!restrictedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    const updatedBusiness = await Business.findOneAndUpdate(
      { _id: businessId, userId },
      updateData,
      { new: true }
    );

    if (!updatedBusiness) {
      return res
        .status(404)
        .json({ message: "Business not found or not owned by user" });
    }

    res.json({
      message: "Business updated successfully",
      business: updatedBusiness,
    });
  } catch (error) {
    console.error("Error updating business:", error);
    res.status(500).json({ message: "Server error" });
  }
};
