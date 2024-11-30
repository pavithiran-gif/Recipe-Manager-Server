CREATE TABLE Recipes (
    RecipeID INT IDENTITY(1,1) PRIMARY KEY,
    RecipeName NVARCHAR(255) NOT NULL,
    Ingredients NVARCHAR(MAX),
    Instructions NVARCHAR(MAX),
    Categories NVARCHAR(MAX),
    Tags NVARCHAR(MAX),
    Servings INT,
    TotalTime INT,
    CookTime INT,
    PrepTime INT,
    ImagePath NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
)

ALTER TABLE Recipes
ADD Description NVARCHAR(MAX);

UPDATE Recipes
SET Description = 'Chicken recipe perfect for lunch.'
WHERE RecipeID = 1;

USE RecipeManagerDB
SELECT * FROM Auth_Users

SELECT * FROM Recipes

SELECT * FROM UserFavorites

CREATE TABLE UserFavorites (
    ID INT IDENTITY(1,1) PRIMARY KEY, -- Unique ID for each favorite
    UserID INT NOT NULL,              -- Foreign key to `Auth_Users` table
    RecipeID INT NOT NULL,            -- Foreign key to `Recipes` table
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_UserFavorites_Users FOREIGN KEY (UserID) REFERENCES Auth_Users(auth_user_id) ON DELETE CASCADE,
    CONSTRAINT FK_UserFavorites_Recipes FOREIGN KEY (RecipeID) REFERENCES Recipes(RecipeID) ON DELETE CASCADE
);


CREATE TABLE Categories (
    CategoryID INT PRIMARY KEY IDENTITY(1,1),
    CategoryName NVARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE Tags (
    TagID INT PRIMARY KEY IDENTITY(1,1),
    TagName NVARCHAR(255) NOT NULL UNIQUE
);

SELECT * FROM Categories
SELECT * FROM Tags