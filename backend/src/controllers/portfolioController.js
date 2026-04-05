import Portfolio from "../models/Portfolio.js";

export const getPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ userId: req.user._id }).select(
      "-__v"
    );
    res.json({ message: "Portfolio fetched", portfolio });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch portfolio", error: error.message });
  }
};
