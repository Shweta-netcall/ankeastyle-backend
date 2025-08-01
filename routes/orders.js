// routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order'); // Adjust path if your model is elsewhere

// Middleware for authentication (optional, but highly recommended for admin routes)
// You would replace this with your actual authentication middleware (e.g., JWT verification)
const protect = (req, res, next) => {
  // For demonstration: Check if an 'authorization' header exists
  // In a real app, you'd decode a JWT and set req.user
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    console.log('Authentication token present (mock check)');
    req.user = { id: 'mockUserId', isAdmin: true }; // Mock user for demo
    next();
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// @desc    Get all orders
// @route   GET /orders
// @access  Private/Admin (you might want some routes to be Public)
router.get('/orders', protect, async (req, res) => { // Added 'protect' middleware
  try {
    const orders = await Order.find({}); // Fetch all orders
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server Error: Could not retrieve orders' });
  }
});

// @desc    Get single order by ID
// @route   GET /orders/:id
// @access  Private/Admin (or Private for the specific user who owns it)
router.get('/orders/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email') // Populate user details if needed
      .populate('products.product', 'name image price'); // Populate product details if needed

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error(`Error fetching order ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server Error: Could not retrieve order' });
  }
});

// @desc    Create a new order
// @route   POST /orders
// @access  Private (users can create their own orders)
router.post('/orders', protect, async (req, res) => {
  const {
    orderItems, // Renamed from 'products' for clarity, assuming a structure like [{ product: id, qty: num }]
    shippingAddress,
    paymentMethod,
    taxPrice,
    shippingPrice,
    totalAmount,
  } = req.body; // Ensure you have `app.use(express.json());` in your main server file

  if (orderItems && orderItems.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  } else {
    try {
      // You'd typically calculate totalAmount on the backend to prevent tampering
      // For simplicity, we'll use the passed totalAmount, but in production, calculate it
      // from actual product prices from the database based on orderItems.

      const order = new Order({
        user: req.user.id, // Comes from your authentication middleware
        products: orderItems, // Ensure orderItems match the 'products' schema
        shippingAddress,
        paymentMethod,
        taxPrice,
        shippingPrice,
        totalAmount,
      });

      const createdOrder = await order.save();
      res.status(201).json(createdOrder); // 201 Created
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Server Error: Could not create order' });
    }
  }
});

// @desc    Update an order (e.g., mark as paid/delivered)
// @route   PUT /orders/:id
// @access  Private/Admin
router.put('/orders/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      // Example: Update payment status
      order.isPaid = req.body.isPaid !== undefined ? req.body.isPaid : order.isPaid;
      order.paidAt = req.body.isPaid && !order.paidAt ? new Date() : order.paidAt;

      // Example: Update delivery status
      order.isDelivered = req.body.isDelivered !== undefined ? req.body.isDelivered : order.isDelivered;
      order.deliveredAt = req.body.isDelivered && !order.deliveredAt ? new Date() : order.deliveredAt;

      // You can update other fields here as needed
      // order.totalAmount = req.body.totalAmount || order.totalAmount;

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error(`Error updating order ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server Error: Could not update order' });
  }
});

// @desc    Delete an order
// @route   DELETE /orders/:id
// @access  Private/Admin
router.delete('/orders/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      await order.deleteOne(); // Use deleteOne() or remove() depending on Mongoose version
      res.json({ message: 'Order removed' });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error(`Error deleting order ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server Error: Could not delete order' });
  }
});

module.exports = router;