const User = require("../models/User");
const Course = require("../models/Course");

// @desc    Get courses purchased by logged-in customer
// @route   GET /api/customer/purchased
exports.getPurchasedCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({ path: "purchasedCourses.course", model: "Course" });
    if (!user) return res.status(404).json({ success: false, message: "Customer not found" });
    const purchased = user.purchasedCourses.filter((item) => item.course).map((item) => {
      const course = item.course.toObject();
      course.videoUrl = "";
      course.videos = (course.videos || []).map((video) => ({ id: video.id, title: video.title, duration: video.duration || "", videoId: video.videoId || "" }));
      return { ...course, purchasedAt: item.purchasedAt };
    });
    return res.status(200).json({ success: true, count: purchased.length, data: purchased });
  } catch (error) {
    console.error("Get purchased courses failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load purchased courses" });
  }
};

// Keep the route for compatibility, but never grant free/simulated enrollment.
exports.purchaseCourse = async (req, res) => res.status(410).json({ success: false, message: "Direct course enrollment is disabled. Complete checkout to unlock this course." });

// @desc    Get customer profile
// @route   GET /api/customer/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-__v");

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Customer request failed:", error.message);
    res.status(500).json({ success: false, message: "Unable to complete request" });
  }
};

// @desc    Update customer profile
// @route   PUT /api/customer/profile
exports.updateProfile = async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : null;
    if (name === null || name.length > 100 || /[\u0000-\u001F\u007F]/.test(name)) {
      return res.status(400).json({ success: false, message: "Please provide a valid name (maximum 100 characters)" });
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: { name } }, { new: true, runValidators: true }).select("-__v");

    res.status(200).json({
      success: true,
      message: "Profile updated",
      data: user,
    });
  } catch (error) {
    console.error("Customer request failed:", error.message);
    res.status(500).json({ success: false, message: "Unable to complete request" });
  }
};
