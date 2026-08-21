ARG FRONTEND_IMAGENAME=frontend:2a41caa8b8c49c2a72cc0cff03e9a2e901d720db

FROM ${FRONTEND_IMAGENAME} AS frontend_stage

FROM mcr.microsoft.com/dotnet/nightly/yarp:2.3-preview
WORKDIR /app
COPY --from=frontend_stage /app/dist /app/wwwroot

