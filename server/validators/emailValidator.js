const validateEmail = (req, res, next) => {
  const {
    messageId,
    subject,
    senderName,
    senderEmail,
    receivedDateTime,
  } = req.body;

  if (
    !messageId ||
    !subject ||
    !senderName ||
    !senderEmail ||
    !receivedDateTime
  ) {
    return res.status(400).json({
      success: false,
      message: "All required fields must be provided",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(senderEmail)) {
    return res.status(400).json({
      success: false,
      message: "Invalid sender email address",
    });
  }

  next();
};

module.exports = validateEmail;