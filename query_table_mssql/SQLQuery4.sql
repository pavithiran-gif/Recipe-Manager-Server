USE RecipeManagerDB

CREATE TABLE Auth_Users (
    auth_user_id INT IDENTITY(1,1) PRIMARY KEY,
    reg_email NVARCHAR(255) NOT NULL,
    login_password NVARCHAR(MAX) NOT NULL,
	reg_date DATETIME NOT NULL,
);

CREATE TABLE user_detail (
    email_id NVARCHAR(255) PRIMARY KEY, -- Unique email identifier
    first_name NVARCHAR(255) NULL,      -- Optional first name
    last_name NVARCHAR(255) NULL,       -- Optional last name
    profile_image VARBINARY(MAX) NULL,  -- Image stored as binary
    created_at DATETIME DEFAULT GETDATE(),  -- Creation timestamp
    updated_at DATETIME DEFAULT GETDATE()   -- Update timestamp
);


SELECT * FROM Auth_Users

SELECT * FROM user_detail

select * from recipes

select * from recipeimages



-- Drop foreign key constraints from RecipeImages and Recipes
ALTER TABLE RecipeImages DROP CONSTRAINT FK_RecipeImages_Recipes;
ALTER TABLE Recipes DROP CONSTRAINT FK_Recipes_RecipeImages;

-- Drop foreign key constraints from Ingredients, Instructions, RecipeCategories, and RecipeTags
ALTER TABLE Ingredients DROP CONSTRAINT FK_Ingredients_Recipes;
ALTER TABLE Instructions DROP CONSTRAINT FK_Instructions_Recipes;
ALTER TABLE RecipeCategories DROP CONSTRAINT FK_RecipeCategories_Recipes;
ALTER TABLE RecipeCategories DROP CONSTRAINT FK_RecipeCategories_Categories;
ALTER TABLE RecipeTags DROP CONSTRAINT FK_RecipeTags_Recipes;
ALTER TABLE RecipeTags DROP CONSTRAINT FK_RecipeTags_Tags;


-- Drop junction tables first
DROP TABLE IF EXISTS RecipeCategories;
DROP TABLE IF EXISTS RecipeTags;

-- Drop tables with foreign key dependencies next
DROP TABLE IF EXISTS Ingredients;
DROP TABLE IF EXISTS Instructions;
DROP TABLE IF EXISTS RecipeImages;

-- Drop parent tables last
DROP TABLE IF EXISTS Recipes;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS Tags;
