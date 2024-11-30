-- Create the `recipes` table first without the foreign key constraint to RecipeImages
CREATE TABLE Recipes (
  Id INT IDENTITY(1,1) PRIMARY KEY,            -- Primary key for the recipe
  Name NVARCHAR(255) NOT NULL,                  -- Name of the recipe
  ImageId INT,                                  -- Foreign key referring to the image in the RecipeImages table (will be added later)
  Description NVARCHAR(MAX),                    -- Description of the recipe
  Servings INT NOT NULL,                        -- Number of servings
  TotalTime INT,                                -- Total time in minutes
  CookTime INT,                                 -- Cook time in minutes
  PrepTime INT,                                 -- Preparation time in minutes
  CreatedAt DATETIME DEFAULT GETDATE(),         -- Date when the recipe was created
  UpdatedAt DATETIME DEFAULT GETDATE()          -- Last updated time
);

-- Create the `recipe_images` table now that Recipes exists
CREATE TABLE RecipeImages (
  Id INT IDENTITY(1,1) PRIMARY KEY,            -- Primary key for the image
  RecipeId INT NOT NULL,                        -- Foreign key referring to the Recipes table
  ImageData VARBINARY(MAX),                     -- Binary data for the image (image itself)
  FileName NVARCHAR(255),                       -- Name of the image file (e.g., Recipe_maker.png)
  FileSize INT,                                -- Size of the image file in bytes
  FileType NVARCHAR(50),                        -- MIME type of the image (e.g., image/png)
  CreatedAt DATETIME DEFAULT GETDATE(),         -- Timestamp for when the image was uploaded
  CONSTRAINT FK_RecipeImages_Recipes FOREIGN KEY (RecipeId) REFERENCES Recipes(Id) ON DELETE CASCADE
);

-- Now, alter the `recipes` table to add the foreign key constraint to RecipeImages
ALTER TABLE Recipes
ADD CONSTRAINT FK_Recipes_RecipeImages FOREIGN KEY (ImageId) REFERENCES RecipeImages(Id);


-- Create the `ingredients` table to store ingredients for each recipe
CREATE TABLE Ingredients (
  Id INT IDENTITY(1,1) PRIMARY KEY,      -- Primary key for the ingredient
  RecipeId INT,                          -- Foreign key referring to recipes table
  IngredientName NVARCHAR(255) NOT NULL,  -- Name of the ingredient
  CONSTRAINT FK_Ingredients_Recipes FOREIGN KEY (RecipeId) REFERENCES Recipes(Id) ON DELETE CASCADE
);

-- Create the `instructions` table to store instructions for each recipe
CREATE TABLE Instructions (
  Id INT IDENTITY(1,1) PRIMARY KEY,      -- Primary key for the instruction
  RecipeId INT,                          -- Foreign key referring to recipes table
  StepNumber INT NOT NULL,               -- Step number in the instructions
  StepName NVARCHAR(255) NOT NULL,        -- Title or name of the step
  Description NVARCHAR(MAX),              -- Detailed description of the step
  FooterNote NVARCHAR(MAX),               -- Footer note for the step (if any)
  CONSTRAINT FK_Instructions_Recipes FOREIGN KEY (RecipeId) REFERENCES Recipes(Id) ON DELETE CASCADE
);

-- Create the `categories` table to store categories for each recipe
CREATE TABLE Categories (
  Id INT IDENTITY(1,1) PRIMARY KEY,      -- Primary key for the category
  Name NVARCHAR(255) NOT NULL             -- Name of the category
);

-- Create a junction table to associate recipes with categories
CREATE TABLE RecipeCategories (
  RecipeId INT,                          -- Foreign key referring to recipes table
  CategoryId INT,                        -- Foreign key referring to categories table
  PRIMARY KEY (RecipeId, CategoryId),    -- Composite primary key
  CONSTRAINT FK_RecipeCategories_Recipes FOREIGN KEY (RecipeId) REFERENCES Recipes(Id) ON DELETE CASCADE,
  CONSTRAINT FK_RecipeCategories_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(Id) ON DELETE CASCADE
);

-- Create the `tags` table to store tags for each recipe
CREATE TABLE Tags (
  Id INT IDENTITY(1,1) PRIMARY KEY,      -- Primary key for the tag
  Name NVARCHAR(255) NOT NULL             -- Name of the tag
);

-- Create a junction table to associate recipes with tags
CREATE TABLE RecipeTags (
  RecipeId INT,                          -- Foreign key referring to recipes table
  TagId INT,                             -- Foreign key referring to tags table
  PRIMARY KEY (RecipeId, TagId),         -- Composite primary key
  CONSTRAINT FK_RecipeTags_Recipes FOREIGN KEY (RecipeId) REFERENCES Recipes(Id) ON DELETE CASCADE,
  CONSTRAINT FK_RecipeTags_Tags FOREIGN KEY (TagId) REFERENCES Tags(Id) ON DELETE CASCADE
);




