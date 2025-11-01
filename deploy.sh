#!/bin/bash

# TravelBuddy Azure App Service Deployment Script
# Optimized for production deployment

set -e  # Exit on any error

echo "🚀 Starting TravelBuddy deployment..."
echo "📅 Deployment started at: $(date)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required directories exist
check_directories() {
    print_status "Checking project structure..."
    
    if [ ! -d "frontend" ]; then
        print_error "Frontend directory not found!"
        exit 1
    fi
    
    if [ ! -d "backend" ]; then
        print_error "Backend directory not found!"
        exit 1
    fi
    
    if [ ! -d "admin" ]; then
        print_warning "Admin directory not found, skipping admin build"
        SKIP_ADMIN=true
    fi
    
    print_success "Project structure validated"
}

# Install and build frontend
build_frontend() {
    print_status "Building frontend application..."
    
    cd frontend
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "Frontend package.json not found!"
        exit 1
    fi
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm ci --prefer-offline --no-audit --silent
    
    # Build frontend
    print_status "Building frontend for production..."
    npm run build
    
    # Verify build output
    if [ ! -d "dist" ]; then
        print_error "Frontend build failed - dist directory not found!"
        exit 1
    fi
    
    print_success "Frontend build completed"
    cd ..
}

# Install and build admin dashboard
build_admin() {
    if [ "$SKIP_ADMIN" = true ]; then
        print_warning "Skipping admin dashboard build"
        return
    fi
    
    print_status "Building admin dashboard..."
    
    cd admin
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_warning "Admin package.json not found, skipping admin build"
        cd ..
        return
    fi
    
    # Install dependencies
    print_status "Installing admin dependencies..."
    npm ci --prefer-offline --no-audit --silent
    
    # Build admin
    print_status "Building admin dashboard for production..."
    npm run build
    
    # Verify build output
    if [ ! -d "dist" ]; then
        print_warning "Admin build failed - dist directory not found!"
    else
        print_success "Admin dashboard build completed"
    fi
    
    cd ..
}

# Install backend dependencies
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "Backend package.json not found!"
        exit 1
    fi
    
    # Install production dependencies only
    print_status "Installing backend dependencies (production only)..."
    npm ci --omit=dev --prefer-offline --no-audit --silent
    
    print_success "Backend setup completed"
    cd ..
}

# Copy built files to backend
copy_builds() {
    print_status "Copying built files to backend..."
    
    # Create directories
    mkdir -p backend/public
    if [ "$SKIP_ADMIN" != true ] && [ -d "admin/dist" ]; then
        mkdir -p backend/admin
    fi
    
    # Copy frontend build
    if [ -d "frontend/dist" ]; then
        print_status "Copying frontend build..."
        cp -r frontend/dist/* backend/public/
        print_success "Frontend files copied to backend/public/"
    else
        print_error "Frontend dist directory not found!"
        exit 1
    fi
    
    # Copy admin build if it exists
    if [ "$SKIP_ADMIN" != true ] && [ -d "admin/dist" ]; then
        print_status "Copying admin build..."
        cp -r admin/dist/* backend/admin/
        print_success "Admin files copied to backend/admin/"
    fi
    
    # Verify copied files
    print_status "Verifying copied files..."
    echo "Frontend files in backend/public/:"
    ls -la backend/public/ | head -10
    
    if [ -d "backend/admin" ]; then
        echo "Admin files in backend/admin/:"
        ls -la backend/admin/ | head -10
    fi
}

# Create optimized web.config
create_web_config() {
    print_status "Creating optimized web.config..."
    
    cat > backend/web.config << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <!-- Static Assets -->
        <rule name="StaticAssets" stopProcessing="true">
          <match url="^(assets/.*|static/.*|js/.*|css/.*|images/.*|fonts/.*|.*\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|webp|avif|map))$" />
          <action type="Rewrite" url="public/{R:0}" />
        </rule>
        
        <!-- Admin Routes -->
        <rule name="AdminStatic" stopProcessing="true">
          <match url="^admin/(assets/.*|static/.*|.*\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|map))$" />
          <action type="Rewrite" url="admin/{R:1}" />
        </rule>
        
        <rule name="AdminSPA" stopProcessing="true">
          <match url="^admin/(.*)" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
          </conditions>
          <action type="Rewrite" url="admin/index.html" />
        </rule>
        
        <!-- API Routes -->
        <rule name="API" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="server.js" />
        </rule>
        
        <!-- Health Check -->
        <rule name="Health" stopProcessing="true">
          <match url="^health$" />
          <action type="Rewrite" url="server.js" />
        </rule>
        
        <!-- Frontend SPA -->
        <rule name="FrontendSPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/api/" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/admin/" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/health$" negate="true" />
          </conditions>
          <action type="Rewrite" url="public/index.html" />
        </rule>
      </rules>
    </rewrite>
    
    <staticContent>
      <mimeMap fileExtension=".js" mimeType="application/javascript; charset=utf-8" />
      <mimeMap fileExtension=".mjs" mimeType="application/javascript; charset=utf-8" />
      <mimeMap fileExtension=".css" mimeType="text/css; charset=utf-8" />
      <mimeMap fileExtension=".json" mimeType="application/json; charset=utf-8" />
      <mimeMap fileExtension=".woff" mimeType="font/woff" />
      <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
      <mimeMap fileExtension=".webp" mimeType="image/webp" />
      <mimeMap fileExtension=".avif" mimeType="image/avif" />
    </staticContent>
    
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="52428800" />
      </requestFiltering>
    </security>
    
    <urlCompression doStaticCompression="true" doDynamicCompression="true" />
    <httpErrors existingResponse="PassThrough" />
    
    <iisnode 
      watchedFiles="web.config;*.js"
      loggingEnabled="true"
      debuggingEnabled="false"
      nodeProcessCountPerApplication="1"
      maxConcurrentRequestsPerProcess="1024"
    />
  </system.webServer>
</configuration>
EOF
    
    print_success "web.config created successfully"
}

# Cleanup unnecessary files
cleanup() {
    print_status "Cleaning up unnecessary files..."
    
    cd backend
    
    # Remove development files
    find . -name "*.test.js" -delete 2>/dev/null || true
    find . -name "*.spec.js" -delete 2>/dev/null || true
    find . -name ".DS_Store" -delete 2>/dev/null || true
    find . -name "Thumbs.db" -delete 2>/dev/null || true
    
    # Remove cache directories
    rm -rf node_modules/.cache 2>/dev/null || true
    
    print_success "Cleanup completed"
    cd ..
}

# Display deployment summary
deployment_summary() {
    print_success "🎉 TravelBuddy deployment preparation completed!"
    echo ""
    echo "📊 Deployment Summary:"
    echo "  ✅ Frontend: Built and copied to backend/public/"
    
    if [ "$SKIP_ADMIN" != true ] && [ -d "backend/admin" ]; then
        echo "  ✅ Admin: Built and copied to backend/admin/"
    else
        echo "  ⚠️  Admin: Skipped"
    fi
    
    echo "  ✅ Backend: Dependencies installed (production only)"
    echo "  ✅ web.config: Created and optimized"
    echo "  ✅ Cleanup: Completed"
    echo ""
    echo "📁 Backend directory is ready for deployment:"
    echo "  - server.js (main application)"
    echo "  - public/ (frontend files)"
    
    if [ -d "backend/admin" ]; then
        echo "  - admin/ (admin dashboard)"
    fi
    
    echo "  - web.config (IIS configuration)"
    echo "  - node_modules/ (production dependencies)"
    echo ""
    echo "🚀 Ready for Azure App Service deployment!"
    echo "📅 Deployment completed at: $(date)"
}

# Main execution
main() {
    check_directories
    build_frontend
    build_admin
    setup_backend
    copy_builds
    create_web_config
    cleanup
    deployment_summary
}

# Run main function
main "$@"