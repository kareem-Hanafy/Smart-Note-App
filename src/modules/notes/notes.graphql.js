const { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLList, GraphQLInt, GraphQLID } = require('graphql');
const Note = require('../../models/Note.model');

// User Type for owner info
const UserType = new GraphQLObjectType({
    name: 'User',
    fields: {
        id: { type: GraphQLID },
        email: { type: GraphQLString },
        isVerified: { type: GraphQLString }
    }
});

// Note Type
const NoteType = new GraphQLObjectType({
    name: 'Note',
    fields: {
        id: { type: GraphQLID },
        title: { type: GraphQLString },
        content: { type: GraphQLString },
        owner: { type: UserType },
        createdAt: { type: GraphQLString },
        updatedAt: { type: GraphQLString }
    }
});

// Paginated Notes Type
const PaginatedNotesType = new GraphQLObjectType({
    name: 'PaginatedNotes',
    fields: {
        notes: { type: new GraphQLList(NoteType) },
        totalCount: { type: GraphQLInt },
        currentPage: { type: GraphQLInt },
        totalPages: { type: GraphQLInt },
        hasNextPage: { type: GraphQLString },
        hasPrevPage: { type: GraphQLString }
    }
});

// Root Query
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        notes: {
            type: PaginatedNotesType,
            args: {
                userId: { type: GraphQLID },
                title: { type: GraphQLString },
                createdFrom: { type: GraphQLString },
                createdTo: { type: GraphQLString },
                page: { type: GraphQLInt },
                limit: { type: GraphQLInt }
            },
            resolve: async (parent, args, context) => {
                try {
                    // Check if user is authenticated
                    if (!context.user || !context.user._id) {
                        throw new Error('Authentication required');
                    }

                    const { userId, title, createdFrom, createdTo, page = 1, limit = 10 } = args;
                    const currentUserId = context.user._id;

                    // Build query
                    let query = { ownerId: currentUserId };

                    // Apply filters
                    if (title) {
                        query.$text = { $search: title };
                    }

                    if (createdFrom || createdTo) {
                        query.createdAt = {};
                        if (createdFrom) query.createdAt.$gte = new Date(createdFrom);
                        if (createdTo) query.createdAt.$lte = new Date(createdTo);
                    }

                    // Calculate pagination
                    const skip = (page - 1) * limit;

                    // Get total count for pagination
                    const totalCount = await Note.countDocuments(query);
                    const totalPages = Math.ceil(totalCount / limit);

                    // Get notes with owner info (use lean for better performance)
                    const notes = await Note.find(query)
                        .populate('ownerId', 'email isVerified')
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)
                        .lean();

                    // Transform data for GraphQL response with null checks
                    const transformedNotes = notes.map(note => {
                        // Check if ownerId is populated
                        if (!note.ownerId) {
                            throw new Error(`Note ${note._id} has no owner information`);
                        }

                        return {
                            id: note._id,
                            title: note.title,
                            content: note.content,
                            owner: {
                                id: note.ownerId._id,
                                email: note.ownerId.email,
                                isVerified: note.ownerId.isVerified ? note.ownerId.isVerified.toString() : 'false'
                            },
                            createdAt: note.createdAt.toISOString(),
                            updatedAt: note.updatedAt.toISOString()
                        };
                    });

                    return {
                        notes: transformedNotes,
                        totalCount,
                        currentPage: page,
                        totalPages,
                        hasNextPage: (page < totalPages).toString(),
                        hasPrevPage: (page > 1).toString()
                    };
                } catch (error) {
                    console.error('GraphQL resolver error:', error);
                    throw new Error(`Failed to fetch notes: ${error.message}`);
                }
            }
        }
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery
});
