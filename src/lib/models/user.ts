import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface Address {
  fullName?: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  address?: string;
}

export interface IUser {
  name: string;
  email: string;
  password?: string;
  role: "user" | "admin";
  avatar?: string;
  bio?: string;

  billingAddress?: Address;
  shippingAddress?: Address;

  createdAt: Date;
  updatedAt: Date;
  externalId?: string; 
}

const AddressSchema = new mongoose.Schema<Address>(
  {
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    streetAddress: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    address: { type: String, default: "" },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Please provide your name"],
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: { type: String },
    bio: { type: String },

    billingAddress: { type: AddressSchema, default: {} },
    shippingAddress: { type: AddressSchema, default: {} },

    externalId: { type: String },
  },
  { timestamps: true }
);


userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword: string) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.models.User || mongoose.model<IUser>("User", userSchema);
