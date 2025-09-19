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

export const signup = async (req, res) => {
  try {
    const {
      email,
      password,
      username,
      phone,
      userType,
      firstName,
      lastName,
      gender,
      dob,
      businessName,
    } = req.body;

    if (!email || !password || !username || !phone || !userType) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    if (userType === "user" && (!firstName || !lastName || !dob || !gender)) {
      return res.status(400).json({
        success: false,
        message:
          "First name, last name, gender and date of birth are required for user",
      });
    }

    if (userType === "business" && !businessName) {
      return res.status(400).json({
        success: false,
        message: "Business name is required",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          existingUser.email === email
            ? "Email already in use"
            : "Username already taken",
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 12);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const userData = {
      email,
      gender,
      password: hashedPassword,
      username: username.startsWith("@") ? username.slice(1) : username,
      phone,
      userType,
      isVerified: false,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    if (userType === "user") {
      userData.firstName = firstName;
      userData.lastName = lastName;
      userData.dob = new Date(dob);
    }

    const user = new User(userData);
    await user.save();

    if (userType === "business") {
      const business = new Business({
        userId: user._id,
        businessName,
      });
      await business.save();

      user.businessId = business._id;
      await user.save();
    }

    await sendVerificationEmail(
      user.email,
      verificationToken,
      userType === "business" ? businessName : user.firstName
    );

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email for verification.",
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        userType: user.userType,
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
    const { email, code } = req.body;

    const user = await User.findOneAndUpdate(
      {
        email,
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
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is not verified. Please verify your email before logging in.",
      });
    }

    const token = generateTokenAndSetCookie(res, user._id, rememberMe);

    let userData = {
      _id: user._id,
      email: user.email,
      username: user.username,
      userType: user.userType,
      profilePhoto: user.profilePhoto,
      isVerified: user.isVerified,
      userType: user.userType,
      lastLogin: user.lastLogin || null,
    };

    user.lastLogin = new Date();
    user.isActive = true;
    await user.save();

    if (user.userType === "user") {
      userData = {
        ...userData,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        avatar: user.avatar,
      };
    } else {
      userData = {
        ...userData,
        businessId: user.businessId,
      };
    }

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      rememberMe,
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Error in login ", error);
    res.status(400).json({ success: false, message: error.message });
  }
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

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000;

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;

    await user.save();

    await sendPasswordResetEmail(
      user.email,
      user.firstName,
      `${process.env.CLIENT_URL}/forgot-password?token=${resetToken}`
    );

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.error("Error in forgotPassword ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
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
    console.error("Error in resetPassword ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await bcryptjs.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    const isSameAsOld = await bcryptjs.compare(newPassword, user.password);
    if (isSameAsOld) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as the current password",
      });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in updatePassword:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({
        success: false,
        message: "Email and type are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (type === "email") {
      if (user.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
        });
      }

      const verificationToken = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      user.verificationToken = verificationToken;
      user.verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
      await user.save();

      await sendVerificationEmail(
        user.email,
        verificationToken,
        user.firstName
      );
      return res.status(200).json({
        success: true,
        message: "Verification code resent successfully",
      });
    }

    if (type === "password") {
      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiresAt = Date.now() + 60 * 60 * 1000;
      await user.save();

      await sendPasswordResetEmail(user.email, user.firstName, resetToken);
      return res.status(200).json({
        success: true,
        message: "Password reset link sent successfully",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid type",
    });
  } catch (error) {
    console.error("Error in resendVerification:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const deleteAccount = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { userId } = req;

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.userType === "business" && user.businessId) {
      await Business.findByIdAndDelete(user.businessId);
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteAccount: ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deactivateAccount = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { userId } = req;

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.isActive) {
      return res
        .status(400)
        .json({ success: false, message: "Account already deactivated" });
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (error) {
    console.error("Error in deactivateAccount:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
