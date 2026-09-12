// ============================================================
// Project Monitoring Platform - MongoDB Atlas Collection Setup
// ============================================================
// Run with:
//   mongosh "your-atlas-connection-string" setup-collections.js
// or paste into the Atlas "mongosh" shell / Data Explorer shell.
// ============================================================

use('projectMonitoringDB');

// ---------------------------------------------------------
// 1. users - login & authentication
// ---------------------------------------------------------
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "email", "passwordHash", "role", "createdAt"],
      properties: {
        username: { bsonType: "string" },
        email: { bsonType: "string", pattern: "^.+@.+\\..+$" },
        passwordHash: { bsonType: "string" },
        role: { enum: ["admin", "user"] },
        isAdmin: { bsonType: "bool" },
        lastLogin: { bsonType: "date" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});
db.users.createIndex({ email: 1 }, { unique: true });

// ---------------------------------------------------------
// 2. departments - org structure
// ---------------------------------------------------------
db.createCollection("departments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name"],
      properties: {
        name: { bsonType: "string" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});

// ---------------------------------------------------------
// 3. clients - external clients viewing project progress
// ---------------------------------------------------------
db.createCollection("clients", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        name: { bsonType: "string" },
        email: { bsonType: "string" },
        company: { bsonType: "string" },
        phone: { bsonType: "string" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});
db.clients.createIndex({ email: 1 }, { unique: true });

// ---------------------------------------------------------
// 4. teams - groups of users assigned to projects
// ---------------------------------------------------------
db.createCollection("teams", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "members"],
      properties: {
        name: { bsonType: "string" },
        members: { bsonType: "array", items: { bsonType: "objectId" } },
        departmentId: { bsonType: "objectId" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});

// ---------------------------------------------------------
// 5. projects - core project data
// ---------------------------------------------------------
db.createCollection("projects", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "status", "ownerId", "createdAt"],
      properties: {
        name: { bsonType: "string" },
        description: { bsonType: "string" },
        status: { enum: ["planning", "active", "on-hold", "completed", "cancelled"] },
        startDate: { bsonType: "date" },
        endDate: { bsonType: "date" },
        budget: { bsonType: ["double", "int", "long"] },
        usedbudget : {bsonType: ["double", "int", "long"]},
        ownerId: { bsonType: "objectId" },
        teamId: { bsonType: "objectId" },
        clientId: { bsonType: "objectId" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});
db.projects.createIndex({ status: 1 });
db.projects.createIndex({ ownerId: 1 });

// ---------------------------------------------------------
// 6. milestones - project phases / checkpoints
// ---------------------------------------------------------
db.createCollection("milestones", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["projectId", "title", "dueDate"],
      properties: {
        projectId: { bsonType: "objectId" },
        title: { bsonType: "string" },
        description: { bsonType: "string" },
        dueDate: { bsonType: "date" },
        status: { enum: ["pending", "in-progress", "completed", "delayed"] },
        createdAt: { bsonType: "date" }
      }
    }
  }
});
db.milestones.createIndex({ projectId: 1 });

// ---------------------------------------------------------
// 7. tasks - work items linked to projects
// ---------------------------------------------------------
db.createCollection("tasks", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "projectId", "status", "createdAt"],
      properties: {
        title: { bsonType: "string" },
        description: { bsonType: "string" },
        projectId: { bsonType: "objectId" },
        milestoneId: { bsonType: "objectId" },
        assignedTo: { bsonType: "objectId" },
        status: { enum: ["todo", "in-progress", "review", "done", "blocked"] },
        priority: { enum: ["low", "medium", "high", "critical"] },
        dueDate: { bsonType: "date" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});
db.tasks.createIndex({ projectId: 1 });
db.tasks.createIndex({ assignedTo: 1 });
db.tasks.createIndex({ status: 1 });

// ---------------------------------------------------------
// 8. comments - discussion on tasks / projects
// ---------------------------------------------------------
db.createCollection("comments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["refType", "refId", "authorId", "text", "createdAt"],
      properties: {
        refType: { enum: ["task", "project"] },
        refId: { bsonType: "objectId" },
        authorId: { bsonType: "objectId" },
        text: { bsonType: "string" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});
db.comments.createIndex({ refType: 1, refId: 1 });

// ---------------------------------------------------------
// 9. attachments - file metadata (store binaries in S3/GridFS)
// ---------------------------------------------------------
db.createCollection("attachments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["refType", "refId", "fileName", "fileUrl", "uploadedBy", "createdAt"],
      properties: {
        refType: { enum: ["task", "project"] },
        refId: { bsonType: "objectId" },
        fileName: { bsonType: "string" },
        fileUrl: { bsonType: "string" },
        fileSize: { bsonType: ["int", "long"] },
        uploadedBy: { bsonType: "objectId" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});
db.attachments.createIndex({ refType: 1, refId: 1 });

// ---------------------------------------------------------
// 10. timelogs - time tracking per task/user
// ---------------------------------------------------------
db.createCollection("timelogs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["taskId", "userId", "hours", "date"],
      properties: {
        taskId: { bsonType: "objectId" },
        userId: { bsonType: "objectId" },
        hours: { bsonType: ["double", "int"] },
        description: { bsonType: "string" },
        date: { bsonType: "date" }
      }
    }
  }
});
db.timelogs.createIndex({ taskId: 1 });
db.timelogs.createIndex({ userId: 1 });

// ---------------------------------------------------------
// 11. notifications - alerts to users
// ---------------------------------------------------------
db.createCollection("notifications", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "message", "isRead", "createdAt"],
      properties: {
        userId: { bsonType: "objectId" },
        type: { bsonType: "string" },
        message: { bsonType: "string" },
        isRead: { bsonType: "bool" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});
db.notifications.createIndex({ userId: 1, isRead: 1 });

// ---------------------------------------------------------
// 12. activityLogs - audit trail
// ---------------------------------------------------------
db.createCollection("activityLogs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "action", "createdAt"],
      properties: {
        userId: { bsonType: "objectId" },
        action: { bsonType: "string" },
        refType: { bsonType: "string" },
        refId: { bsonType: "objectId" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});
db.activityLogs.createIndex({ userId: 1 });
db.activityLogs.createIndex({ createdAt: -1 });

// ---------------------------------------------------------
// 13. risks - risk / issue register
// ---------------------------------------------------------
db.createCollection("risks", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["projectId", "title", "severity", "status", "createdAt"],
      properties: {
        projectId: { bsonType: "objectId" },
        title: { bsonType: "string" },
        description: { bsonType: "string" },
        severity: { enum: ["low", "medium", "high", "critical"] },
        status: { enum: ["open", "mitigated", "closed"] },
        createdAt: { bsonType: "date" }
      }
    }
  }
});
db.risks.createIndex({ projectId: 1 });

// ---------------------------------------------------------
// 14. reports - cached/generated reports
// ---------------------------------------------------------
db.createCollection("reports", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["projectId", "type", "generatedAt"],
      properties: {
        projectId: { bsonType: "objectId" },
        type: { bsonType: "string" },
        data: { bsonType: "object" },
        generatedBy: { bsonType: "objectId" },
        generatedAt: { bsonType: "date" }
      }
    }
  }
});
db.reports.createIndex({ projectId: 1 });
