"use strict";

const mongoose = require("mongoose");

const { Schema } = mongoose;

/* ============================================================
   ENUMS
============================================================ */

const TASK_STATUS = [
  "Pending",
  "In Progress",
  "On Hold",
  "Completed",
  "Cancelled",
];

const TASK_PRIORITY = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

const TASK_SOURCE = [
  "Manual",
  "Outlook Email",
  "Microsoft Graph",
  "AI Generated",
  "System",
];

const TASK_TYPE = [
  "General",
  "Email Follow-up",
  "Meeting",
  "Approval",
  "Support",
  "Bug",
  "Feature",
  "Reminder",
  "Invoice",
  "Sales",
];

const REMINDER_STATUS = [
  "Pending",
  "Sent",
  "Dismissed",
];

/* ============================================================
   COMMENT SCHEMA
============================================================ */

const CommentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    name: {
      type: String,
      trim: true,
      default: "",
    },

    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ============================================================
   ATTACHMENT SCHEMA
============================================================ */

const AttachmentSchema = new Schema(
  {
    fileName: {
      type: String,
      default: "",
      trim: true,
    },

    fileType: {
      type: String,
      default: "",
      trim: true,
    },

    fileSize: {
      type: Number,
      default: 0,
      min: 0,
    },

    url: {
      type: String,
      default: "",
      trim: true,
    },

    outlookAttachmentId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

/* ============================================================
   AI SCHEMA
============================================================ */

const AISchema = new Schema(
  {
    summary: {
      type: String,
      default: "",
      trim: true,
    },

    actionItems: [
      {
        type: String,
        trim: true,
      },
    ],

    sentiment: {
      type: String,
      default: "Neutral",
      trim: true,
    },

    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    suggestedReply: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    extractedPriority: {
      type: String,
      default: "",
      trim: true,
    },

    extractedDueDate: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

/* ============================================================
   REMINDER SCHEMA
============================================================ */

const ReminderSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },

    reminderDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: REMINDER_STATUS,
      default: "Pending",
    },
  },
  {
    _id: false,
  }
);

/* ============================================================
   ACTIVITY LOG SCHEMA
============================================================ */

const ActivitySchema = new Schema(
  {
    action: {
      type: String,
      default: "",
      trim: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    name: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

/* ============================================================
   MAIN TASK SCHEMA
============================================================ */

const taskSchema = new Schema(
  {
    /* ========================================================
       BASIC INFORMATION
    ======================================================== */

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    company: {
      type: String,
      default: "",
      trim: true,
    },

    senderName: {
      type: String,
      default: "",
      trim: true,
    },

    senderEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    customerName: {
      type: String,
      default: "",
      trim: true,
    },

    customerEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    /* ========================================================
       OUTLOOK EMAIL
    ======================================================== */

    emailId: {
      type: Schema.Types.ObjectId,
      ref: "Email",
      default: null,
    },

    outlookMessageId: {
      type: String,
      default: "",
      trim: true,
    },

    conversationId: {
      type: String,
      default: "",
      trim: true,
    },

    internetMessageId: {
      type: String,
      default: "",
      trim: true,
    },

    /* ========================================================
       TASK DETAILS
    ======================================================== */

    type: {
      type: String,
      enum: TASK_TYPE,
      default: "General",
    },

    category: {
      type: String,
      default: "General",
      trim: true,
    },

    source: {
      type: String,
      enum: TASK_SOURCE,
      default: "Manual",
    },

    priority: {
      type: String,
      enum: TASK_PRIORITY,
      default: "Medium",
    },

    status: {
      type: String,
      enum: TASK_STATUS,
      default: "Pending",
    },

    assignedTo: {
      type: String,
      default: "",
      trim: true,
    },

    assignedBy: {
      type: String,
      default: "",
      trim: true,
    },

    owner: {
      type: String,
      default: "",
      trim: true,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    /* ========================================================
       TAGS & LABELS
    ======================================================== */

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    labels: [
      {
        type: String,
        trim: true,
      },
    ],

    /* ========================================================
       REMINDER
    ======================================================== */

    reminder: {
      type: ReminderSchema,
      default: () => ({}),
    },

    /* ========================================================
       AI
    ======================================================== */

    ai: {
      type: AISchema,
      default: () => ({}),
    },

    /* ========================================================
       ATTACHMENTS
    ======================================================== */

    attachments: {
      type: [AttachmentSchema],
      default: [],
    },

    /* ========================================================
       COMMENTS
    ======================================================== */

    comments: {
      type: [CommentSchema],
      default: [],
    },

    /* ========================================================
       ACTIVITY LOGS
    ======================================================== */

    activityLogs: {
      type: [ActivitySchema],
      default: [],
    },

    /* ========================================================
       ENTERPRISE
    ======================================================== */

    /*
      IMPORTANT:

      unique:true creates the required unique index.

      DO NOT add:

      taskSchema.index({ taskNumber: 1 });

      Otherwise Mongoose gives duplicate index warning.
    */

    taskNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: String,
      default: "",
      trim: true,
    },

    estimatedHours: {
      type: Number,
      default: 0,
      min: 0,
    },

    actualHours: {
      type: Number,
      default: 0,
      min: 0,
    },

    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    slaHours: {
      type: Number,
      default: 24,
      min: 0,
    },

    watchers: [
      {
        type: String,
        trim: true,
      },
    ],

    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ============================================================
   DATABASE INDEXES
============================================================ */

/* Search */

taskSchema.index({
  title: "text",
  description: "text",
  company: "text",
  senderName: "text",
});

/* Filters */

taskSchema.index({
  status: 1,
});

taskSchema.index({
  priority: 1,
});

taskSchema.index({
  dueDate: 1,
});

taskSchema.index({
  assignedTo: 1,
});

taskSchema.index({
  company: 1,
});

taskSchema.index({
  createdAt: -1,
});

/* Outlook */

taskSchema.index({
  emailId: 1,
});

taskSchema.index({
  outlookMessageId: 1,
});

taskSchema.index({
  conversationId: 1,
});

/*
  NO taskNumber index here.
*/

/* Enterprise */

taskSchema.index({
  completionPercentage: 1,
});

taskSchema.index({
  lastActivityAt: -1,
});

/* ============================================================
   VIRTUALS
============================================================ */

taskSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate) {
    return false;
  }

  return (
    this.status !== "Completed" &&
    this.status !== "Cancelled" &&
    !this.isDeleted &&
    this.dueDate < new Date()
  );
});

taskSchema.virtual("isCompleted").get(function () {
  return this.status === "Completed";
});

taskSchema.virtual("daysRemaining").get(function () {
  if (!this.dueDate) {
    return null;
  }

  const oneDay = 1000 * 60 * 60 * 24;

  return Math.ceil(
    (this.dueDate.getTime() - Date.now()) / oneDay
  );
});

/* ============================================================
   JSON OPTIONS
============================================================ */

taskSchema.set("toJSON", {
  virtuals: true,
});

taskSchema.set("toObject", {
  virtuals: true,
});

/* ============================================================
   PRE SAVE
============================================================ */

taskSchema.pre("save", function (next) {
  if (this.title) {
    this.title = this.title.trim();
  }

  if (this.company) {
    this.company = this.company.trim();
  }

  if (this.senderName) {
    this.senderName = this.senderName.trim();
  }

  if (this.senderEmail) {
    this.senderEmail = this.senderEmail
      .toLowerCase()
      .trim();
  }

  if (this.customerEmail) {
    this.customerEmail = this.customerEmail
      .toLowerCase()
      .trim();
  }

  if (this.taskNumber) {
    this.taskNumber = this.taskNumber.trim();
  }

  /* Started */

  if (
    this.status === "In Progress" &&
    !this.startedAt
  ) {
    this.startedAt = new Date();
  }

  /* Completed */

  if (
    this.status === "Completed" &&
    !this.completedAt
  ) {
    this.completedAt = new Date();
  }

  /* Reopened */

  if (this.status !== "Completed") {
    this.completedAt = null;
  }

  /* Completion percentage */

  switch (this.status) {
    case "Pending":
      this.completionPercentage = 0;
      break;

    case "In Progress":
      if (this.completionPercentage < 1) {
        this.completionPercentage = 50;
      }
      break;

    case "On Hold":
      break;

    case "Completed":
      this.completionPercentage = 100;
      break;

    case "Cancelled":
      this.completionPercentage = 0;
      break;

    default:
      break;
  }

  this.lastActivityAt = new Date();

  next();
});

/* ============================================================
   INSTANCE METHODS
============================================================ */

taskSchema.methods.startTask = function () {
  this.status = "In Progress";

  if (!this.startedAt) {
    this.startedAt = new Date();
  }

  return this.save();
};

taskSchema.methods.markCompleted = function () {
  this.status = "Completed";
  this.completedAt = new Date();
  this.completionPercentage = 100;

  return this.save();
};

taskSchema.methods.cancelTask = function () {
  this.status = "Cancelled";

  return this.save();
};

taskSchema.methods.softDelete = function (
  deletedBy = ""
) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy || "";

  return this.save();
};

taskSchema.methods.restore = function () {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = "";

  return this.save();
};

taskSchema.methods.assignUser = function (user) {
  this.assignedTo = user || "";

  return this.save();
};

taskSchema.methods.addComment = function (comment) {
  if (!comment) {
    throw new Error("Comment is required.");
  }

  this.comments.push(comment);

  return this.save();
};

taskSchema.methods.addActivity = function (activity) {
  if (!activity) {
    throw new Error("Activity is required.");
  }

  this.activityLogs.push(activity);
  this.lastActivityAt = new Date();

  return this.save();
};

taskSchema.methods.addAttachment = function (
  attachment
) {
  if (!attachment) {
    throw new Error("Attachment is required.");
  }

  this.attachments.push(attachment);

  return this.save();
};

taskSchema.methods.addWatcher = function (watcher) {
  if (!watcher) {
    return this.save();
  }

  if (!this.watchers.includes(watcher)) {
    this.watchers.push(watcher);
  }

  return this.save();
};

taskSchema.methods.removeWatcher = function (
  watcher
) {
  this.watchers = this.watchers.filter(
    (item) => item !== watcher
  );

  return this.save();
};

/* ============================================================
   STATIC METHODS
============================================================ */

taskSchema.statics.getPending = function () {
  return this.find({
    status: "Pending",
    isDeleted: false,
  });
};

taskSchema.statics.getCompleted = function () {
  return this.find({
    status: "Completed",
    isDeleted: false,
  });
};

taskSchema.statics.getInProgress = function () {
  return this.find({
    status: "In Progress",
    isDeleted: false,
  });
};

taskSchema.statics.getHighPriority = function () {
  return this.find({
    priority: {
      $in: ["High", "Critical"],
    },
    isDeleted: false,
  });
};

taskSchema.statics.getOverdue = function () {
  return this.find({
    dueDate: {
      $lt: new Date(),
    },

    status: {
      $nin: ["Completed", "Cancelled"],
    },

    isDeleted: false,
  });
};

taskSchema.statics.getTodayTasks = function () {
  const start = new Date();

  start.setHours(
    0,
    0,
    0,
    0
  );

  const end = new Date();

  end.setHours(
    23,
    59,
    59,
    999
  );

  return this.find({
    dueDate: {
      $gte: start,
      $lte: end,
    },

    isDeleted: false,
  });
};

taskSchema.statics.getDashboardStats =
  async function () {
    const [
      total,
      pending,
      progress,
      completed,
      overdue,
      highPriority,
    ] = await Promise.all([
      this.countDocuments({
        isDeleted: false,
      }),

      this.countDocuments({
        status: "Pending",
        isDeleted: false,
      }),

      this.countDocuments({
        status: "In Progress",
        isDeleted: false,
      }),

      this.countDocuments({
        status: "Completed",
        isDeleted: false,
      }),

      this.countDocuments({
        dueDate: {
          $lt: new Date(),
        },

        status: {
          $nin: [
            "Completed",
            "Cancelled",
          ],
        },

        isDeleted: false,
      }),

      this.countDocuments({
        priority: {
          $in: [
            "High",
            "Critical",
          ],
        },

        isDeleted: false,
      }),
    ]);

    return {
      total,
      pending,
      inProgress: progress,
      completed,
      overdue,
      highPriority,
    };
  };

/* ============================================================
   QUERY HELPERS
============================================================ */

taskSchema.query.active = function () {
  return this.where({
    isDeleted: false,
  });
};

taskSchema.query.deleted = function () {
  return this.where({
    isDeleted: true,
  });
};

taskSchema.query.pending = function () {
  return this.where({
    status: "Pending",
    isDeleted: false,
  });
};

taskSchema.query.completed = function () {
  return this.where({
    status: "Completed",
    isDeleted: false,
  });
};

taskSchema.query.inProgress = function () {
  return this.where({
    status: "In Progress",
    isDeleted: false,
  });
};

taskSchema.query.highPriority = function () {
  return this.where({
    priority: {
      $in: [
        "High",
        "Critical",
      ],
    },

    isDeleted: false,
  });
};

taskSchema.query.byCompany = function (
  company
) {
  return this.where({
    company,
    isDeleted: false,
  });
};

taskSchema.query.byUser = function (
  user
) {
  return this.where({
    assignedTo: user,
    isDeleted: false,
  });
};

/* ============================================================
   EXPORT
============================================================ */

module.exports =
  mongoose.models.Task ||
  mongoose.model(
    "Task",
    taskSchema
  );