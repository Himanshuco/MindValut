import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { connectDB } from './dbconnection.js';
import { ContentModel, LinkModel, UserModel, FolderModel } from './db.js';
import { random } from './utils.js';

// Load environment variables from .env file
dotenv.config();

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

const allowedOrigins = [
  "https://mind-valut-fronted.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));
app.use(express.json());
connectDB();

const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            message: 'Access token required' 
        });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ 
                message: 'Invalid or expired token' 
            });
        }
        req.user = user;
        next();
    });
};

//Signup Route
app.post("/api/v1/signup", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long"
            });
        }

        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
            return res.status(409).json({
                message: "Username already exists"
            });
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = await UserModel.create({
            username,
            password: hashedPassword
        });


        const token = jwt.sign(
            { 
                userId: user._id, 
                username: user.username 
            },
            JWT_SECRET,
            { expiresIn: '7d' } 
        );

        res.status(201).json({
            message: "User signed up successfully",
            token,
            user: {
                id: user._id,
                username: user.username
            }
        });

    } catch (error: any) {
        console.error('Signup error:', error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});

//Signin Route
app.post("/api/v1/signin", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        const user = await UserModel.findOne({ username });
        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password as string);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }


        const token = jwt.sign(
            { 
                userId: user._id, 
                username: user.username 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username
            }
        });

    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});

// Token Validation Route
app.post("/api/v1/validate-token", authenticateToken, (req: any, res) => {
    res.json({
        message: "Token is valid",
        user: {
            userId: req.user.userId,
            username: req.user.username
        }
    });
});


// Content Routes
app.post("/api/v1/content", authenticateToken, async (req: any, res) => {
    try {
        const { link, type, title, text, folderId } = req.body;

        if (!type || !title) {
            return res.status(400).json({
                message: "Type and title are required"
            });
        }

        // Validation based on content type
        if (type === 'text') {
            if (!text || text.trim() === '') {
                return res.status(400).json({
                    message: "Text content is required for text type"
                });
            }
        } else if (type === 'video' || type === 'youtube' || type === 'twitter' || type === 'document' || type === 'image') {
            if (!link || link.trim() === '') {
                return res.status(400).json({
                    message: "Link is required for this content type"
                });
            }
        } else {
            return res.status(400).json({
                message: "Invalid content type. Supported types: text, video, youtube, twitter, document, image"
            });
        }

        // Verify folder ownership if folderId is provided
        if (folderId) {
            const folder = await FolderModel.findOne({ 
                _id: folderId, 
                userId: req.user.userId 
            });
            if (!folder) {
                return res.status(404).json({
                    message: "Folder not found or access denied"
                });
            }
        }

        const content = await ContentModel.create({
            link: link || null,
            type,
            title,
            text: text || null,
            folderId: folderId || null,
            userId: req.user.userId,
            tags: []
        });

        res.json({ 
            message: "Content added successfully", 
            content: {
                id: content._id,
                link: content.link,
                type: content.type,
                title: content.title,
                text: content.text,
                folderId: content.folderId
            }
        });
    } catch (err: any) {
        res.status(500).json({ message: "Error creating content", error: err.message });
    }
});

app.get("/api/v1/content", authenticateToken, async (req: any, res) => {
    try {
        const { folderId } = req.query;
        
        let filter: any = { userId: req.user.userId };
        
        // If folderId is provided, filter by folder
        if (folderId !== undefined) {
            if (folderId === 'null' || folderId === '') {
                filter.folderId = null; // Root level content
            } else {
                filter.folderId = folderId;
            }
        }

        const contents = await ContentModel.find(filter)
            .populate('userId', 'username')
            .populate('folderId', 'name color')
            .sort({ createdAt: -1 });

        res.json({
            contents: contents.map(content => ({
                id: content._id,
                link: content.link,
                type: content.type,
                title: content.title,
                text: content.text,
                folderId: content.folderId,
                folder: content.folderId ? {
                    id: (content.folderId as any)._id,
                    name: (content.folderId as any).name,
                    color: (content.folderId as any).color
                } : null,
                tags: content.tags
            }))
        });
    } catch (err: any) {
        res.status(500).json({ message: "Error fetching content", error: err.message });
    }
});


app.delete("/api/v1/content/:contentId", authenticateToken, async (req: any, res) => {
    try {
        const { contentId } = req.params;
        
        const deletedContent = await ContentModel.findOneAndDelete({
            _id: contentId,
            userId: req.user.userId
        });

        if (!deletedContent) {
            return res.status(404).json({
                message: "Content not found or you don't have permission to delete it"
            });
        }

        res.json({
            message: "Content deleted successfully"
        });
    } catch (err: any) {
        res.status(500).json({ message: "Error deleting content", error: err.message });
    }
});

// Folder Routes
app.post("/api/v1/folders", authenticateToken, async (req: any, res) => {
    try {
        const { name, description, color } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Folder name is required"
            });
        }

        // Check if folder name already exists for this user
        const existingFolder = await FolderModel.findOne({
            name: name.trim(),
            userId: req.user.userId
        });

        if (existingFolder) {
            return res.status(409).json({
                message: "Folder with this name already exists"
            });
        }

        const folder = await FolderModel.create({
            name: name.trim(),
            description: description?.trim() || '',
            color: color || '#3B82F6',
            userId: req.user.userId
        });

        res.json({
            message: "Folder created successfully",
            folder: {
                id: folder._id,
                name: folder.name,
                description: folder.description,
                color: folder.color,
                createdAt: folder.createdAt
            }
        });
    } catch (err: any) {
        res.status(500).json({ message: "Error creating folder", error: err.message });
    }
});

app.get("/api/v1/folders", authenticateToken, async (req: any, res) => {
    try {
        const folders = await FolderModel.find({
            userId: req.user.userId
        }).sort({ createdAt: -1 });

        // Get content count for each folder
        const foldersWithCounts = await Promise.all(
            folders.map(async (folder) => {
                const contentCount = await ContentModel.countDocuments({
                    folderId: folder._id,
                    userId: req.user.userId
                });

                return {
                    id: folder._id,
                    name: folder.name,
                    description: folder.description,
                    color: folder.color,
                    contentCount,
                    createdAt: folder.createdAt
                };
            })
        );

        res.json({
            folders: foldersWithCounts
        });
    } catch (err: any) {
        res.status(500).json({ message: "Error fetching folders", error: err.message });
    }
});

app.put("/api/v1/folders/:folderId", authenticateToken, async (req: any, res) => {
    try {
        const { folderId } = req.params;
        const { name, description, color } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Folder name is required"
            });
        }

        // Check if folder exists and belongs to user
        const folder = await FolderModel.findOne({
            _id: folderId,
            userId: req.user.userId
        });

        if (!folder) {
            return res.status(404).json({
                message: "Folder not found or access denied"
            });
        }

        // Check if new name conflicts with existing folder
        if (name.trim() !== folder.name) {
            const existingFolder = await FolderModel.findOne({
                name: name.trim(),
                userId: req.user.userId,
                _id: { $ne: folderId }
            });

            if (existingFolder) {
                return res.status(409).json({
                    message: "Folder with this name already exists"
                });
            }
        }

        const updatedFolder = await FolderModel.findByIdAndUpdate(
            folderId,
            {
                name: name.trim(),
                description: description?.trim() || '',
                color: color || folder.color
            },
            { new: true }
        );

        if (!updatedFolder) {
            return res.status(404).json({
                message: "Folder not found after update"
            });
        }

        res.json({
            message: "Folder updated successfully",
            folder: {
                id: updatedFolder._id,
                name: updatedFolder.name,
                description: updatedFolder.description,
                color: updatedFolder.color
            }
        });
    } catch (err: any) {
        res.status(500).json({ message: "Error updating folder", error: err.message });
    }
});

app.delete("/api/v1/folders/:folderId", authenticateToken, async (req: any, res) => {
    try {
        const { folderId } = req.params;
        const { moveContent } = req.query; // 'root' or another folderId

        // Check if folder exists and belongs to user
        const folder = await FolderModel.findOne({
            _id: folderId,
            userId: req.user.userId
        });

        if (!folder) {
            return res.status(404).json({
                message: "Folder not found or access denied"
            });
        }

        // Handle content in the folder
        if (moveContent === 'root') {
            // Move all content to root level (no folder)
            await ContentModel.updateMany(
                { folderId: folderId, userId: req.user.userId },
                { folderId: null }
            );
        } else if (moveContent) {
            // Move to another folder
            const targetFolder = await FolderModel.findOne({
                _id: moveContent,
                userId: req.user.userId
            });

            if (!targetFolder) {
                return res.status(404).json({
                    message: "Target folder not found"
                });
            }

            await ContentModel.updateMany(
                { folderId: folderId, userId: req.user.userId },
                { folderId: moveContent }
            );
        } else {
            // Delete all content in the folder
            await ContentModel.deleteMany({
                folderId: folderId,
                userId: req.user.userId
            });
        }

        // Delete the folder
        await FolderModel.findByIdAndDelete(folderId);

        res.json({
            message: "Folder deleted successfully"
        });
    } catch (err: any) {
        res.status(500).json({ message: "Error deleting folder", error: err.message });
    }
});

// Edit content
app.put("/api/v1/content/:contentId", authenticateToken, async (req: any, res) => {
    try {
        const { contentId } = req.params;
        const { link, type, title, text, folderId } = req.body;
        
        // Check if content belongs to user
        const content = await ContentModel.findOne({
            _id: contentId,
            userId: req.user.userId
        });
        
        if (!content) {
            return res.status(404).json({ message: "Content not found" });
        }
        
        // Validate content type
        const validTypes = ['twitter', 'youtube', 'document', 'text', 'image'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ message: "Invalid content type" });
        }
        
        // Update content
        const updatedContent = await ContentModel.findByIdAndUpdate(
            contentId,
            { link, type, title, text, folderId: folderId || null },
            { new: true }
        );
        
        res.json({ 
            message: "Content updated successfully",
            content: {
                id: updatedContent?._id,
                link: updatedContent?.link,
                type: updatedContent?.type,
                title: updatedContent?.title,
                text: updatedContent?.text,
                folderId: updatedContent?.folderId
            }
        });
    } catch (err: any) {
        res.status(500).json({ message: "Error updating content", error: err.message });
    }
});

app.delete("/api/v1/content", authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.body;
        
        const content = await ContentModel.findOne({
            _id: id,
            userId: req.user.userId
        });
        
        if (!content) {
            return res.status(404).json({ message: "Content not found" });
        }
        
        await ContentModel.findByIdAndDelete(id);
        
        res.json({ message: "Content deleted successfully" });
    } catch (err: any) {
        res.status(500).json({ message: "Error deleting content", error: err.message });
    }
});

app.post("/api/v1/brain/share", authenticateToken, async (req : any, res) => {
    try {
        const { share } = req.body;
        
        if (share) {
            // Check if link already exists
            const existingLink = await LinkModel.findOne({
                userId: req.user.userId
            });
            
            if (existingLink) {
                return res.json({
                    message: "Brain is already shared",
                    hash: existingLink.hash
                });
            }
            
            // Create new share link
            const newLink = await LinkModel.create({
                userId: req.user.userId,
                hash: random(10)
            });
            
            res.json({
                message: "Brain shared successfully",
                hash: newLink.hash
            });
        } else {
            // Remove share link
            await LinkModel.deleteOne({
                userId: req.user.userId
            });
            
            res.json({
                message: "Brain unshared successfully"
            });
        }
    } catch (err: any) {
        res.status(500).json({ message: "Error updating share link", error: err.message });
    }
});

app.get("/api/v1/brain/share/status", authenticateToken, async (req: any, res) => {
    try {
        const shareLink = await LinkModel.findOne({
            userId: req.user.userId
        });
        
        res.json({
            isShared: !!shareLink,
            hash: shareLink?.hash || null
        });
    } catch (err: any) {
        res.status(500).json({ message: "Error checking share status", error: err.message });
    }
});

app.get("/api/v1/brain/:sharelink", async (req, res) => {
    try {
        const { sharelink } = req.params;
        
        // Find the link
        const link = await LinkModel.findOne({
            hash: sharelink
        });
        
        if (!link) {
            return res.status(404).json({
                message: "Shared brain not found"
            });
        }
        
        // Get the user's content with folder information
        const contents = await ContentModel.find({
            userId: link.userId
        }).populate('userId', 'username').populate('folderId', 'name color');
        
        // Get the user's folders
        const folders = await FolderModel.find({
            userId: link.userId
        }).select('name color description');
        
        console.log('Shared brain debug:', {
            userId: link.userId,
            contentCount: contents.length,
            folderCount: folders.length,
            contents: contents.map(c => ({
                id: c._id,
                title: c.title,
                type: c.type,
                folderId: c.folderId,
                hasFolder: !!c.folderId
            }))
        });
        
        const user = await UserModel.findById(link.userId);
        
        res.json({
            message: "Shared brain accessed successfully",
            owner: user?.username,
            folders: folders.map(folder => ({
                id: folder._id,
                name: folder.name,
                color: folder.color,
                description: folder.description
            })),
            contents: contents.map(content => {
                const folderInfo = content.folderId ? {
                    id: (content.folderId as any)._id || content.folderId,
                    name: (content.folderId as any).name,
                    color: (content.folderId as any).color
                } : null;
                
                return {
                    id: content._id,
                    link: content.link,
                    type: content.type,
                    title: content.title,
                    text: content.text,
                    folderId: folderInfo?.id || (content.folderId ? content.folderId.toString() : null),
                    folder: folderInfo
                };
            })
        });
    } catch (err: any) {
        res.status(500).json({ message: "Error accessing shared brain", error: err.message });
    }
});
app.get("/", (req, res) => {
    res.send("MindValut Backend is running.");
});

app.listen(8000, () => {
    console.log("Server started on port 8000");
});