

Notes:
To migrate just the content model (not the content) i found this easy method with the contentful CLI

Select the Environment where you have your content types
```
contentful space environment use
```

Generate a migration of a specific content type. It will do all for you and generate a .js file
```
contentful space generate migration -c contentTypeName
```

Change to the other Environment
```
contentful space environment use
```

Run the migration and apply it
```
contentful space migration MigrationFileName.js
```

Press “Y” to confirm

Done