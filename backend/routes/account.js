const express = require('express');
const { authMiddleware } = require('../middleware.js');
const { Account, Request, User } = require('../db/db.js');
const { default: mongoose } = require('mongoose');
const router = express.Router();


// An endpoint for user to get their balance.
router.get("/balance", authMiddleware, async function (req, res) {
    const account = await Account.findOne({
        userId: req.userId
    });

    res.json({
        balance: account.balance
    });
});


// An endpoint for user to transfer money to another account
router.post("/transfer", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();

    session.startTransaction();
    const { amount, to } = req.body;

    // Fetch the accounts within the transaction
    const account = await Account.findOne({ userId: req.userId }).session(session);

    if (!account || account.balance < amount) {
        await session.abortTransaction();
        return res.status(200).json({
            message: "Insufficient balance",
            status: "-1"
        });
    }

    const toAccount = await Account.findOne({ userId: to }).session(session);

    if (!toAccount) {
        await session.abortTransaction();
        return res.status(200).json({
            message: "Invalid account",
            status: "-1"
        });
    }

    // Perform the transfer
    await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount } }).session(session);
    await Account.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);

    // Commit the transaction
    await session.commitTransaction();
    res.status(200).json({
        message: "Transfer successful",
        status: "1"
    });
});

// Create a money request
router.post("/request", authMiddleware, async (req, res) => {
    try {
        const { amount, to } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                message: "Invalid amount",
                status: "-1"
            });
        }

        const toUser = await User.findById(to);
        if (!toUser) {
            return res.status(400).json({
                message: "Invalid user",
                status: "-1"
            });
        }

        const newRequest = await Request.create({
            requesterId: req.userId,
            requesteeId: to,
            amount: amount,
            status: "pending"
        });

        res.status(200).json({
            message: "Request created successfully",
            status: "1",
            requestId: newRequest._id
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating request",
            status: "-1"
        });
    }
});

// Get all pending requests for the current user (requests made TO them)
router.get("/requests", authMiddleware, async (req, res) => {
    try {
        const requests = await Request.find({
            requesteeId: req.userId,
            status: "pending"
        }).populate("requesterId", "firstName lastName username");

        res.status(200).json({
            requests: requests
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching requests",
            requests: []
        });
    }
});

// Respond to a money request (approve or reject)
router.post("/request/respond", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { requestId, action } = req.body; // action: "approve" or "reject"

        const request = await Request.findById(requestId).session(session);

        if (!request) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Request not found",
                status: "-1"
            });
        }

        if (request.requesteeId.toString() !== req.userId) {
            await session.abortTransaction();
            return res.status(403).json({
                message: "Unauthorized",
                status: "-1"
            });
        }

        if (request.status !== "pending") {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Request already processed",
                status: "-1"
            });
        }

        if (action === "approve") {
            // Check if requestee has sufficient balance
            const account = await Account.findOne({ userId: req.userId }).session(session);

            if (!account || account.balance < request.amount) {
                await session.abortTransaction();
                return res.status(200).json({
                    message: "Insufficient balance",
                    status: "-1"
                });
            }

            // Perform the transfer (from requestee to requester)
            await Account.updateOne(
                { userId: req.userId },
                { $inc: { balance: -request.amount } }
            ).session(session);

            await Account.updateOne(
                { userId: request.requesterId },
                { $inc: { balance: request.amount } }
            ).session(session);

            request.status = "approved";
            await request.save({ session });

            await session.commitTransaction();
            res.status(200).json({
                message: "Request approved and transfer completed",
                status: "1"
            });
        } else if (action === "reject") {
            request.status = "rejected";
            await request.save({ session });

            await session.commitTransaction();
            res.status(200).json({
                message: "Request rejected",
                status: "1"
            });
        } else {
            await session.abortTransaction();
            res.status(400).json({
                message: "Invalid action",
                status: "-1"
            });
        }
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            message: "Error processing request",
            status: "-1"
        });
    } finally {
        session.endSession();
    }
});



module.exports = {
    accountRouter: router
}