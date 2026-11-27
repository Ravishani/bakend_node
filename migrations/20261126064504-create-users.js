
module.exports = {
    async up(db, client) {
        const collections = await db.listCollections(
            { name: "users" },
            { nameOnly: true }
        ).toArray();

        if (collections.length === 0) {
            await db.createCollection("users", {
                validator: {
                    $jsonSchema: {
                        bsonType: "object",
                        required: [
                            "name",
                            "email",
                            "password",
                            "role",
                            "status"
                        ],
                        properties: {
                            name: {
                                bsonType: "string",
                                description: "User name is required"
                            },
                            email: {
                                bsonType: "string",
                                description: "Email is required"
                            },
                            password: {
                                bsonType: "string",
                                description: "Password hash is required"
                            },
                            mobile: {
                                bsonType: ["string", "null"]
                            },
                            role: {
                                bsonType: "string",
                                enum: ["admin", "user"]
                            },
                            status: {
                                bsonType: "int",
                                enum: [0, 1]
                            },
                            createdAt: {
                                bsonType: "date"
                            },
                            updatedAt: {
                                bsonType: "date"
                            }
                        }
                    }
                },
                validationLevel: "moderate"
            });
        }

        await db.collection("users").createIndex(
            { email: 1 },
            {
                unique: true,
                name: "users_email_unique"
            }
        );

        await db.collection("users").createIndex(
            { role: 1, status: 1 },
            {
                name: "users_role_status_index"
            }
        );
    },

    async down(db, client) {
        const collections = await db.listCollections(
            { name: "users" },
            { nameOnly: true }
        ).toArray();

        if (collections.length > 0) {
            await db.collection("users").drop();
        }
    }
};
