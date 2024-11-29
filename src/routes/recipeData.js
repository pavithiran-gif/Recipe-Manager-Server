const express = require("express");
const router = express.Router();
const sql = require("mssql");
const config = require("../config/dbconfig");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/config");
const moment = require('moment');

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, '../uploads/recipes/');
fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed'));
    }
});

router.post('/recipe', upload.single("image"), async (req, res) => {
    let pool;
    try {
        // Destructure all received data
        const { 
            recipeName, 
            Description, 
            ingredients, 
            instructions, 
            categories, 
            tags, 
            servings, 
            totalTime, 
            cookTime, 
            prepTime 
        } = req.body;

        // Get image path if file exists
        const imagePath = req.file 
            ? req.file.path.replace(/\\/g, '/') // Normalize path separators
            : null;

        // Establish database connection
        pool = await sql.connect(config);

        // Prepare insert query
        const request = pool.request();
        
        const insertQuery = `
            INSERT INTO Recipes 
            (RecipeName,Description, Ingredients, Instructions, Categories, Tags, 
            Servings, TotalTime, CookTime, PrepTime, ImagePath)
            OUTPUT INSERTED.RecipeID
            VALUES 
            (@recipeName,@Description , @ingredients, @instructions, @categories, @tags, 
            @servings, @totalTime, @cookTime, @prepTime, @imagePath)
        `;

        // Add parameters
        request.input('recipeName', sql.NVarChar, recipeName);
        request.input('Description', sql.NVarChar, Description);
        request.input('ingredients', sql.NVarChar, ingredients);
        request.input('instructions', sql.NVarChar, instructions);
        request.input('categories', sql.NVarChar, categories);
        request.input('tags', sql.NVarChar, tags);
        request.input('servings', sql.Int, parseInt(servings));
        request.input('totalTime', sql.Int, parseInt(totalTime));
        request.input('cookTime', sql.Int, parseInt(cookTime));
        request.input('prepTime', sql.Int, parseInt(prepTime));
        request.input('imagePath', sql.NVarChar, imagePath);

        // Execute insert and get the new recipe ID
        const result = await request.query(insertQuery);

        res.status(200).json({ 
            message: 'Recipe saved successfully',
            recipeId: result.recordset[0].RecipeID,
            imagePath: imagePath 
        });

    } catch (error) {
        console.error('Error saving recipe:', error);
        res.status(500).json({ 
            message: 'Error saving recipe',
            error: error.message 
        });
    } finally {
        // Close the connection if it exists
        if (pool) {
            try {
                await pool.close();
            } catch (closeError) {
                console.error('Error closing database connection:', closeError);
            }
        }
    }
});

// Retrieve recipe endpoint
router.get('/recipe/:id', async (req, res) => {
    let pool;
    try {
        pool = await sql.connect(config);
        const request = pool.request();
        
        const query = `
            SELECT * FROM Recipes 
            WHERE RecipeID = @recipeId
        `;
        
        request.input('recipeId', sql.Int, req.params.id);
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        const processedRecipe = {
            ...result.recordset[0], // Extract the first record (since `:id` expects one recipe)
            // Normalize image path to be server-accessible
            ImagePath: result.recordset[0].ImagePath 
                ? `/uploads/recipes/${path.basename(result.recordset[0].ImagePath)}` 
                : '/default-recipe.jpg'
        };
        
        res.status(200).json(processedRecipe);
    } catch (error) {
        console.error('Error retrieving recipe:', error);
        res.status(500).json({ 
            message: 'Error retrieving recipe',
            error: error.message 
        });
    } finally {
        if (pool) {
            try {
                await pool.close();
            } catch (closeError) {
                console.error('Error closing database connection:', closeError);
            }
        }
    }
});

// Retrieve all recipes endpoint
router.get('/recipes', async (req, res) => {
    let pool;
    try {
        pool = await sql.connect(config);
        const request = pool.request();
        
        const query = `
            SELECT * 
            FROM Recipes 
            ORDER BY CreatedAt DESC
        `;
        
        const result = await request.query(query);
        
        // Process images to create accessible URLs
        const processedRecipes = result.recordset.map((recipe) => ({
            ...recipe,
            // Normalize image path to be server-accessible
            ImagePath: recipe.ImagePath 
                ? `/uploads/recipes/${path.basename(recipe.ImagePath)}` 
                : '/default-recipe.jpg'
        }));
        
        res.status(200).json(processedRecipes);
    } catch (error) {
        console.error('Error retrieving recipes:', error);
        res.status(500).json({ 
            message: 'Error retrieving recipes',
            error: error.message 
        });
    } finally {
        if (pool) {
            try {
                await pool.close();
            } catch (closeError) {
                console.error('Error closing database connection:', closeError);
            }
        }
    }
});

// Optional: Add an endpoint for specific image retrieval
router.get('/recipe-image/:filename', (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, '../uploads/recipes', filename);
    
    res.sendFile(imagePath, (err) => {
        if (err) {
            res.status(404).send('Image not found');
        }
    });
});

router.post('/favorites', async (req, res) => {
    let pool;
    try {
        // Extract and verify the JWT
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("Authorization token is required")
            return res.status(401).json({ error: "Authorization token is required" });
        }

        const token = authHeader && authHeader.split(" ")[1]; // Bearer token
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, jwtSecret); // Verify the token
        } catch (err) {
            console.log("Invalid or expired token")
            return res.status(401).json({ error: "Invalid or expired token" });
        }

        // Extract email from the decoded token
        const email = decodedToken.email;

        // Establish database connection
        pool = await sql.connect(config);
        const request = pool.request();

        // Get the user ID from the Auth_Users table using the email
        const getUserQuery = `
            SELECT auth_user_id 
            FROM Auth_Users 
            WHERE reg_email = @reg_email
        `;
        request.input('reg_email', sql.NVarChar, email);
        const userResult = await request.query(getUserQuery);

        if (userResult.recordset.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const userId = userResult.recordset[0].auth_user_id;

        // Get the recipe ID from the request body
        const { recipeId } = req.body;

        // Check if the recipe is already in favorites
        const checkQuery = `
            SELECT * FROM UserFavorites WHERE UserID = @userId AND RecipeID = @recipeId
        `;
        request.input('userId', sql.Int, userId);
        request.input('recipeId', sql.Int, recipeId);

        const existingFavorite = await request.query(checkQuery);

        if (existingFavorite.recordset.length > 0) {
            return res.status(400).json({ message: 'Recipe is already in favorites' });
        }

        // Add to favorites
        const insertQuery = `
            INSERT INTO UserFavorites (UserID, RecipeID, CreatedAt)
            VALUES (@userId, @recipeId, GETDATE())
        `;
        await request.query(insertQuery);

        res.status(200).json({ message: 'Added to favorites' });
    } catch (error) {
        console.error('Error adding to favorites:', error);
        res.status(500).json({ message: 'Error adding to favorites', error: error.message });
    } finally {
        if (pool) await pool.close();
    }
});

router.delete('/favorites', async (req, res) => {
    let pool;
    try {
        // Extract and verify the JWT
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("Authorization token is required")
            return res.status(401).json({ error: "Authorization token is required" });
        }
        
        const token = authHeader && authHeader.split(" ")[1]; // Bearer token
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, jwtSecret); // Verify the token
        } catch (err) {
            console.log("Invalid or expired token")
            return res.status(401).json({ error: "Invalid or expired token" });
        }

        // Extract email from the decoded token
        const email = decodedToken.email;

        // Establish database connection
        pool = await sql.connect(config);
        const request = pool.request();

        // Get the user ID from the Auth_Users table using the email
        const getUserQuery = `
            SELECT auth_user_id 
            FROM Auth_Users 
            WHERE reg_email = @reg_email
        `;
        request.input('reg_email', sql.NVarChar, email);
        const userResult = await request.query(getUserQuery);

        if (userResult.recordset.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const userId = userResult.recordset[0].auth_user_id;

        // Get the recipe ID from the request body
        const { recipeId } = req.body;

        // Delete from favorites
        const deleteQuery = `
            DELETE FROM UserFavorites WHERE UserID = @userId AND RecipeID = @recipeId
        `;
        request.input('userId', sql.Int, userId);
        request.input('recipeId', sql.Int, recipeId);

        const result = await request.query(deleteQuery);

        // Check if any rows were affected
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Favorite not found' });
        }

        res.status(200).json({ message: 'Removed from favorites' });
    } catch (error) {
        console.error('Error removing from favorites:', error);
        res.status(500).json({ message: 'Error removing from favorites', error: error.message });
    } finally {
        if (pool) await pool.close();
    }
});


router.get('/userfavorites', async (req, res) => {
    let pool;
    try {
        // Extract and verify the JWT token from the Authorization header
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Authorization token is required" });
        }
        
        // Extract the token (after "Bearer")
        const token = authHeader.split(" ")[1];
        let decodedToken;
        
        try {
            // Verify the token using the jwtSecret
            decodedToken = jwt.verify(token, jwtSecret);
        } catch (err) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }
        
        // Extract email from the decoded token
        const email = decodedToken.email;
        
        // Establish database connection
        pool = await sql.connect(config);
        const request = pool.request();

        // Query to get the user ID based on the email from the Auth_Users table
        const getUserQuery = `
            SELECT auth_user_id
            FROM Auth_Users
            WHERE reg_email = @reg_email
        `;
        request.input('reg_email', sql.NVarChar, email);
        const userResult = await request.query(getUserQuery);

        // If no user found, return an error
        if (userResult.recordset.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const userId = userResult.recordset[0].auth_user_id;

        // Retrieve favorite recipes for the user
        const query = `
            SELECT r.RecipeID, r.RecipeName, r.Description, r.ImagePath
            FROM UserFavorites uf
            INNER JOIN Recipes r ON uf.RecipeID = r.RecipeID
            WHERE uf.UserID = @userId
        `;
        request.input('userId', sql.Int, userId);

        const result = await request.query(query);

        const processedFavorites = result.recordset.map((recipe) => ({
            ...recipe,
            ImagePath: recipe.ImagePath
                ? `/uploads/recipes/${path.basename(recipe.ImagePath)}`
                : '/default-recipe.jpg'
        }));

        res.status(200).json(processedFavorites);

    } catch (error) {
        console.error('Error retrieving favorites:', error);
        res.status(500).json({ message: 'Error retrieving favorites', error: error.message });
    } finally {
        if (pool) await pool.close();
    }
});

const getTimestamp = () => moment().format('YYYY-MM-DD HH:mm:ss');

router.get('/userfavorites/ids', async (req, res) => {
    let pool;
    console.log(`[${getTimestamp()}] Starting query execution...`);


    try {
        // Extract and verify the JWT token from the Authorization header
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Authorization token is required" });
        }
        
        // Extract the token (after "Bearer")
        const token = authHeader.split(" ")[1];
        let decodedToken;
        
        try {
            // Verify the token using the jwtSecret
            decodedToken = jwt.verify(token, jwtSecret);
        } catch (err) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }
        
        // Extract email from the decoded token
        const email = decodedToken.email;
        
        // Establish database connection
        pool = await sql.connect(config);
        const request = pool.request();

        // Query to get the user ID based on the email from the Auth_Users table
        const getUserQuery = `
            SELECT auth_user_id
            FROM Auth_Users
            WHERE reg_email = @reg_email
        `;
        request.input('reg_email', sql.NVarChar, email);
        const userResult = await request.query(getUserQuery);

        // If no user found, return an error
        if (userResult.recordset.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const userId = userResult.recordset[0].auth_user_id;

        // Retrieve the list of RecipeIDs that the user has favorited
        const query = `
            SELECT RecipeID
            FROM UserFavorites
            WHERE UserID = @userId
        `;
        request.input('userId', sql.Int, userId);

        const result = await request.query(query);

        // If no favorites found, return an empty array
        if (result.recordset.length === 0) {
            return res.status(200).json({ message: 'No favorites found', recipeIds: [] });
        }

        // Extract only the RecipeIDs from the result
        const favoriteRecipeIds = result.recordset.map(row => row.RecipeID);

        res.status(200).json({ recipeIds: favoriteRecipeIds });

    } catch (error) {
        console.error('Error retrieving favorite recipe IDs:', error);
        res.status(500).json({ message: 'Error retrieving favorite recipe IDs', error: error.message });
    } finally {
        if (pool) {
            try {
                await pool.close();  // Make sure to close the connection pool after the query
            } catch (closeError) {
                console.error('Error closing database connection:', closeError);
            }
        }
    }
});

// Edit Recipe Endpoint
router.put('/recipe/edit/:id', upload.single("image"), async (req, res) => {
    let pool;
    console.log(`[${getTimestamp()}] /recipe/edit/:id...`);
    try {
        // Destructure all received data
        const { 
            recipeName, 
            Description, 
            ingredients, 
            instructions, 
            categories, 
            tags, 
            servings, 
            totalTime, 
            cookTime, 
            prepTime 
        } = req.body;

        // Establish database connection
        pool = await sql.connect(config);
        const request = pool.request();

        // Prepare image path
        let imagePath = null;
        if (req.file) {
            imagePath = req.file.path.replace(/\\/g, '/');
        }

        // Prepare update query
        const updateQuery = `
            UPDATE Recipes 
            SET 
                RecipeName = @recipeName,
                Description = @Description,
                Ingredients = @ingredients,
                Instructions = @instructions,
                Categories = @categories,
                Tags = @tags,
                Servings = @servings,
                TotalTime = @totalTime,
                CookTime = @cookTime,
                PrepTime = @prepTime
                ${imagePath ? ', ImagePath = @imagePath' : ''}
            WHERE RecipeID = @recipeId
        `;

        // Add parameters
        request.input('recipeId', sql.Int, req.params.id);
        request.input('recipeName', sql.NVarChar, recipeName);
        request.input('Description', sql.NVarChar, Description);
        request.input('ingredients', sql.NVarChar, ingredients);
        request.input('instructions', sql.NVarChar, instructions);
        request.input('categories', sql.NVarChar, categories);
        request.input('tags', sql.NVarChar, tags);
        request.input('servings', sql.Int, parseInt(servings));
        request.input('totalTime', sql.Int, parseInt(totalTime));
        request.input('cookTime', sql.Int, parseInt(cookTime));
        request.input('prepTime', sql.Int, parseInt(prepTime));
        
        // Only add imagePath if a new image was uploaded
        if (imagePath) {
            request.input('imagePath', sql.NVarChar, imagePath);
        }

        // Execute update
        const result = await request.query(updateQuery);

        res.status(200).json({ 
            message: 'Recipe updated successfully',
            recipeId: req.params.id,
            imagePath: imagePath 
        });

    } catch (error) {
        console.error('Error updating recipe:', error);
        res.status(500).json({ 
            message: 'Error updating recipe',
            error: error.message 
        });
    } finally {
        if (pool) {
            try {
                await pool.close();
            } catch (closeError) {
                console.error('Error closing database connection:', closeError);
            }
        }
    }
});

// Delete Recipe Endpoint
router.delete('/recipe/:id', async (req, res) => {
    let pool;
    try {
        // Establish database connection
        pool = await sql.connect(config);
        const request = pool.request();

        // First, check if the recipe exists
        const checkQuery = `
            SELECT * FROM Recipes 
            WHERE RecipeID = @recipeId
        `;
        request.input('recipeId', sql.Int, req.params.id);
        const checkResult = await request.query(checkQuery);

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        // If recipe exists, proceed with deletion
        const deleteQuery = `
            DELETE FROM Recipes 
            WHERE RecipeID = @recipeId
        `;

        const result = await request.query(deleteQuery);

        // Remove associated image file if it exists
        const imagePath = checkResult.recordset[0].ImagePath;
        if (imagePath && fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        res.status(200).json({ 
            message: 'Recipe deleted successfully',
            recipeId: req.params.id 
        });

    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ 
            message: 'Error deleting recipe',
            error: error.message 
        });
    } finally {
        if (pool) {
            try {
                await pool.close();
            } catch (closeError) {
                console.error('Error closing database connection:', closeError);
            }
        }
    }
});

// Fetch all categories
router.get('/categories', async (req, res) => {
    let pool;
    try {
        pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM Categories');
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    } finally {
        if (pool) await pool.close();
    }
});

// Add a new category
router.post('/categories', async (req, res) => {
    let pool;
    try {
        const { categoryName } = req.body;
        pool = await sql.connect(config);
        const result = await pool.request()
            .input('categoryName', sql.NVarChar, categoryName)
            .query('INSERT INTO Categories (CategoryName) VALUES (@categoryName)');
        res.status(201).json({ message: 'Category added successfully' });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ message: 'Error adding category', error: error.message });
    } finally {
        if (pool) await pool.close();
    }
});

// Fetch all tags
router.get('/tags', async (req, res) => {
    let pool;
    try {
        pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM Tags');
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ message: 'Error fetching tags', error: error.message });
    } finally {
        if (pool) await pool.close();
    }
});

// Add a new tag
router.post('/tags', async (req, res) => {
    let pool;
    try {
        const { tagName } = req.body;
        pool = await sql.connect(config);
        const result = await pool.request()
            .input('tagName', sql.NVarChar, tagName)
            .query('INSERT INTO Tags (TagName) VALUES (@tagName)');
        res.status(201).json({ message: 'Tag added successfully' });
    } catch (error) {
        console.error('Error adding tag:', error);
        res.status(500).json({ message: 'Error adding tag', error: error.message });
    } finally {
        if (pool) await pool.close();
    }
});

module.exports = router;