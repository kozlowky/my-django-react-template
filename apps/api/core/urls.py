from django.contrib import admin
from django.http import HttpRequest, HttpResponse
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from strawberry.django.views import GraphQLView

from core.graphql.context import GraphQLContext
from core.graphql.schema import schema


class SeltedGraphQLView(GraphQLView):
    def get_context(  # type: ignore[override]
        self, request: HttpRequest, response: HttpResponse
    ) -> GraphQLContext:
        return GraphQLContext(request=request, response=response)


urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "graphql/",
        csrf_exempt(
            SeltedGraphQLView.as_view(
                schema=schema,
                multipart_uploads_enabled=True,  # для createPost с файлами
            ),
        ),
    ),
]
