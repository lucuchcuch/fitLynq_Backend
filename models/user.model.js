import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // creates unique index automatically
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true, // creates unique index automatically
      trim: true,
      lowercase: true,
    },
    phone: {
      countryCode: String,
      number: String,
      full: String, // combined for searching
    },
    userType: {
      type: String,
      enum: ["user", "business"],
      required: true,
    },
    firstName: {
      type: String,
      required: function () {
        return this.userType === "user";
      },
    },
    lastName: {
      type: String,
      required: function () {
        return this.userType === "user";
      },
    },
    dob: {
      type: Date,
      required: function () {
        return this.userType === "user";
      },
    },
    businessName: String,
    businessType: String,
    profilePhoto: {
      public_id: String,
      url: String,
    },
    bio: {
      type: String,
      maxlength: 150,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    settings: {
      locationPrefs: String,
      notificationPrefs: {
        email: Boolean,
        push: Boolean,
      },
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    recentActivities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Activity",
      },
    ],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    averageRatings: {
      sportiness: { type: Number, default: 0 },
      kindness: { type: Number, default: 0 },
      sociability: { type: Number, default: 0 },
      punctuality: { type: Number, default: 0 },
      teamwork: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      reliability: { type: Number, default: 0 },
      fairPlay: { type: Number, default: 0 },
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    averageFacilityRatings: {
      cleanliness: { type: Number, default: 0 },
      equipmentQuality: { type: Number, default: 0 },
      staffFriendliness: { type: Number, default: 0 },
      safety: { type: Number, default: 0 },
      amenities: { type: Number, default: 0 },
      accessibility: { type: Number, default: 0 },
      valueForMoney: { type: Number, default: 0 },
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    totalCommissionEarned: {
      type: Number,
      default: 0,
    },
    referrals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Referral",
      },
    ],

    // These fields should be inside the schema object, not outside
    verificationToken: String,
    verificationTokenExpiresAt: Date,
    lastLogin: Date,
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.verificationToken;
        delete ret.verificationTokenExpiresAt;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpiresAt;
        return ret;
      },
    },
  }
);

// Index phone.full for search performance
userSchema.index({ "phone.full": 1 });

// Indexes for counts to optimize queries
userSchema.index({ followersCount: 1 });
userSchema.index({ followingCount: 1 });

// Middleware to update followersCount and followingCount on save
userSchema.pre("save", function (next) {
  if (this.isModified("followers")) {
    this.followersCount = this.followers.length;
  }
  if (this.isModified("following")) {
    this.followingCount = this.following.length;
  }
  next();
});

// Middleware to delete Cloudinary profile photo on user removal
userSchema.pre("remove", async function (next) {
  if (this.profilePhoto?.public_id) {
    try {
      await cloudinary.uploader.destroy(this.profilePhoto.public_id);
    } catch (err) {
      console.error("Error deleting profile photo from Cloudinary:", err);
    }
  }
  next();
});

export const User = mongoose.model("User", userSchema);

const businessSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessType: String,
    industry: String,
    website: String,
    description: String,

    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    taxId: String,
    registrationNumber: String,
  },
  { timestamps: true }
);

export const Business = mongoose.model("Business", businessSchema);
