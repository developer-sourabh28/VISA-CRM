import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      required: [true, "Role is required"],
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, "Role ID is required"],
    },
    branch: {
      type: String,
      default: "Main Office",
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    permissions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    notes: {
      type: String,
    },
    lastLogin: {
      type: Date,
    },
    profileImage: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "teammembers", // Custom collection name
  }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password.startsWith("$2")) {
    return candidatePassword === this.password;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to find user by email
UserSchema.statics.findByEmail = async function (email) {
  console.log("Finding user by email:", email);
  const user = await this.findOne({ email }).select("+password");
  console.log("User found:", user ? "Yes" : "No");
  return user;
};

const User = mongoose.model("User", UserSchema);
export default User;
