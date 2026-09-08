import strawberry

from accounts.graphql.mutations import AccountsMutation
from accounts.graphql.queries import AccountsQuery
from posts.graphql.mutations import PostsMutation, PostsInteractionMutation
from posts.graphql.queries import PostsQuery


@strawberry.type
class Query(AccountsQuery, PostsQuery):
    pass


@strawberry.type
class Mutation(AccountsMutation, PostsMutation, PostsInteractionMutation):
    pass


schema = strawberry.Schema(query=Query, mutation=Mutation)
