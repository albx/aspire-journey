ARG FRONTEND_IMAGENAME=frontend:17696863928b5a82f4831bfea6e1dd1f0788d6cc

FROM ${FRONTEND_IMAGENAME} AS frontend_stage

FROM mcr.microsoft.com/dotnet/nightly/yarp:2.3-preview
WORKDIR /app
COPY --from=frontend_stage /app/dist /app/wwwroot

