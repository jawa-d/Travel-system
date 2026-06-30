FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY Trinsu.Backend.sln ./
COPY src/Trinsu.Api/Trinsu.Api.csproj src/Trinsu.Api/
COPY src/Trinsu.Application/Trinsu.Application.csproj src/Trinsu.Application/
COPY src/Trinsu.Domain/Trinsu.Domain.csproj src/Trinsu.Domain/
COPY src/Trinsu.Infrastructure/Trinsu.Infrastructure.csproj src/Trinsu.Infrastructure/
RUN dotnet restore Trinsu.Backend.sln

COPY . .
RUN dotnet publish src/Trinsu.Api/Trinsu.Api.csproj -c Release -o /app/publish --no-restore -p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080 \
    DOTNET_EnableDiagnostics=0
RUN addgroup --system trinsu \
    && adduser --system --ingroup trinsu --home /app --no-create-home trinsu
COPY --from=build --chown=trinsu:trinsu /app/publish .
USER trinsu
EXPOSE 8080
ENTRYPOINT ["dotnet", "Trinsu.Api.dll"]
