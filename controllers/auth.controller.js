import bcryptjs from "bcryptjs";
import crypto from "crypto";

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
  sendPasswordResetEmail,
  sendResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../mailtrap/emails.js";
import { User, Business } from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

export const signup = async (req, res) => {
  try {
    const {
      email,
      password,
      username,
      phone,
      userType,
      // User fields
      firstName,
      lastName,
      dob,
      // Business fields
      businessName,
      businessType,
    } = req.body;

    // Basic validation
    if (!email || !password || !username || !phone || !userType) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // Additional validation based on user type
    console.log("dob: ", dob);
    if (userType === "user" && (!firstName || !lastName || !dob)) {
      return res.status(400).json({
        success: false,
        message: "First name, last name and birth date are required for users",
      });
    }

    if (userType === "business" && !businessName) {
      return res.status(400).json({
        success: false,
        message: "Business name is required",
      });
    }

    // Check if email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({
        // Changed from 400 to 409
        success: false,
        message:
          existingUser.email === email
            ? "Email already in use"
            : "Username already taken",
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Create user
    const userData = {
      email,
      password: hashedPassword,
      username: username.startsWith("@") ? username.slice(1) : username,
      phone: {
        countryCode: phone.countryCode,
        number: phone.number,
        full: `${phone.countryCode}${phone.number}`,
      },
      userType,
      isVerified: false,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    // Add user-specific fields
    if (userType === "user") {
      userData.firstName = firstName;
      userData.lastName = lastName;
      userData.dob = new Date(dob);
    }

    // Add business-specific fields
    if (userType === "business") {
      userData.businessName = businessName;
      userData.businessType = businessType;
    }

    const user = new User(userData);
    await user.save();

    // If business, create business profile
    if (userType === "business") {
      const business = new Business({
        userId: user._id,
        businessName,
        businessType,
        // Add other business fields from req.body as needed
      });
      await business.save();
    }

    // Generate JWT token
    generateTokenAndSetCookie(res, user._id);

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken, user.firstName);

    // Return response
    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email for verification.",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        userType: user.userType,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;

    const user = await User.findOneAndUpdate(
      {
        verificationToken: code,
        verificationTokenExpiresAt: { $gt: Date.now() },
        isVerified: false,
      },
      {
        $set: {
          isVerified: true,
          verificationToken: undefined,
          verificationTokenExpiresAt: undefined,
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // Send welcome email
    await sendWelcomeEmail(
      user.email,
      user.userType === "business"
        ? user.businessName
        : `${user.firstName} ${user.lastName}`
    );

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        userType: user.userType,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Error in verifyEmail:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const login = async (req, res) => {
  const { email, password, rememberMe } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Generate token with rememberMe option
    const token = generateTokenAndSetCookie(res, user._id, rememberMe);

    user.lastLogin = new Date();
    await user.save();

    // Return user data without sensitive information
    const userData = {
      _id: user._id,
      email: user.email,
      username: user.username,
      userType: user.userType,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePhoto: user.profilePhoto,
      isVerified: user.isVerified,
      businessName: user.businessName,
      businessType: user.businessType,
    };

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      rememberMe,
      user: userData,
      token, // Optional: if you want to use token in localStorage as well
    });
  } catch (error) {
    console.log("Error in login ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;

    await user.save();

    // send email
    await sendPasswordResetEmail(
      user.email,
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    );

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.log("Error in forgotPassword ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    // update password
    const hashedPassword = await bcryptjs.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    await sendResetSuccessEmail(user.email);

    res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.log("Error in resetPassword ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "-password -verificationToken -resetPasswordToken"
    );
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    const userData = {
      _id: user._id,
      email: user.email,
      username: user.username,
      userType: user.userType,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePhoto: user.profilePhoto,
      isVerified: user.isVerified,
      businessName: user.businessName,
      businessType: user.businessType,
    };

    res.status(200).json({ success: true, user: userData });
  } catch (error) {
    console.log("Error in checkAuth ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resendverification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate new verification code
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    user.verificationToken = verificationToken;
    user.verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Resend verification email
    await sendVerificationEmail(user.email, verificationToken);

    res.status(200).json({
      success: true,
      message: "Verification code resent successfully",
    });
  } catch (error) {
    console.error("Error in resendverification:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const updateProfile = async (req, res) => {
  try {
    const { bio } = req.body;
    const userId = req.userId;
    let profilePhoto = null;

    // Upload new profile photo if provided
    if (req.file) {
      // Delete old photo if exists
      const user = await User.findById(userId);
      if (user.profilePhoto?.public_id) {
        await cloudinary.uploader.destroy(user.profilePhoto.public_id);
      }

      // Upload new photo
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_photos",
        width: 500,
        height: 500,
        crop: "fill",
        gravity: "face",
      });

      profilePhoto = {
        public_id: result.public_id,
        url: result.secure_url,
      };

      // Delete file from server
      fs.unlinkSync(req.file.path);
    }

    // Update user profile
    const updateData = { bio };
    if (profilePhoto) {
      updateData.profilePhoto = profilePhoto;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password -verificationToken -resetPasswordToken");

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

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

export const getCurrentUser = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findById(req.session.userId).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const completeBusinessRegistration = async (req, res) => {
  try {
    const { userId, address } = req.body;

    // Update user with address
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          address,
          registrationComplete: true,
        },
      },
      { new: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Generate auth token
    const token = generateTokenAndSetCookie(user._id);

    res.status(200).json({
      success: true,
      message: "Registration complete",
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to complete registration",
      error: error.message,
    });
  }
};
