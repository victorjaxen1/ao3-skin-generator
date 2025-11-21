# Test Imgur Upload with Postman CLI
# First, you need to register at: https://api.imgur.com/oauth2/addclient
# Then add your Client ID below

$CLIENT_ID = "YOUR_CLIENT_ID_HERE"

# Test image upload
Write-Host "Testing Imgur anonymous upload..." -ForegroundColor Cyan

# Create a simple test request
$headers = @{
    "Authorization" = "Client-ID $CLIENT_ID"
}

# You can test with a base64 encoded image or file path
$testImagePath = "test.png"  # Replace with actual test image path

if (Test-Path $testImagePath) {
    $imageBytes = [System.IO.File]::ReadAllBytes($testImagePath)
    $imageBase64 = [Convert]::ToBase64String($imageBytes)
    
    $body = @{
        image = $imageBase64
        type = "base64"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.imgur.com/3/image" -Method Post -Headers $headers -Body $body -ContentType "application/json"
        Write-Host "✓ Upload successful!" -ForegroundColor Green
        Write-Host "Image URL: $($response.data.link)" -ForegroundColor Yellow
    } catch {
        Write-Host "✗ Upload failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "Test image not found. Create a small PNG named 'test.png' to test." -ForegroundColor Yellow
}
