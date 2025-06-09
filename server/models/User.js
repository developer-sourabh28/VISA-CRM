import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const permissionsSchema = new mongoose.Schema({
  dashboard: { type: Boolean, default: false },
  enquiries: { type: Boolean, default: false },
  clients: { type: Boolean, default: false },
  appointments: { type: Boolean, default: false },
  deadlines: { type: Boolean, default: false },
  payments: { type: Boolean, default: false },
  reports: { type: Boolean, default: false },
  settings: { type: Boolean, default: false },
  reminder: { type: Boolean, default: false }
}, { _id: false });

const UserSchema = new mongoose.Schema({
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
    required: true,
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
    type: permissionsSchema,
    default: () => ({})
  },
  notes: {
    type: String,
  },
  lastLogin: {
    type: Date,
  }
}, { 
  timestamps: true,
  collection: 'teammembers' // Changed from 'users' to 'teammembers'
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  // If the stored password is not hashed (plain text), compare directly
  if (!this.password.startsWith('$2')) {
    return candidatePassword === this.password;
  }
  // If the stored password is hashed, use bcrypt compare
  return await bcrypt.compare(candidatePassword, this.password);
};

// Add a static method to find user by email
UserSchema.statics.findByEmail = async function(email) {
  console.log('Finding user by email:', email);
  const user = await this.findOne({ email }).select('+password');
  console.log('User found:', user ? 'Yes' : 'No');
  return user;
};

const User = mongoose.model("User", UserSchema);
export default User;
