function Using-Object
{
  [CmdletBinding()]
  param (
    [Parameter(Mandatory = $true)]
    [AllowEmptyString()]
    [AllowEmptyCollection()]
    [AllowNull()]
    [Object]
    $InputObject,

    [Parameter(Mandatory = $true)]
    [scriptblock]
    $ScriptBlock
  )

  try
  {
    return Invoke-Command $ScriptBlock
  }
  finally
  {
    if ($null -ne $InputObject -and $InputObject -is [System.IDisposable])
    {
      $InputObject.Dispose()
    }
  }
}

function Remove-InvalidFileNameChars
{
  param(
    [Parameter(Mandatory=$true,
      Position=0,
      ValueFromPipeline=$true,
      ValueFromPipelineByPropertyName=$true)]
    [String]$Name
  )

  $invalidChars = [IO.Path]::GetInvalidFileNameChars() -join ''
  $re = "[{0}]" -f [RegEx]::Escape($invalidChars)
  return ($Name -replace $re)
}

function Get-ImageWithRetries
{
  [CmdletBinding()]
  param (
    [Parameter(
      Mandatory = $true,
      ValueFromPipeline=$true
    )]
    [String] $Url,

    [Parameter()]
    [Int] $MaxRetry = 5
  )

  Using-Object ($webClient = New-Object System.Net.WebClient) {
    for ($i = 0; $i -lt $MaxRetry; $i++) {
      try {
        return Using-Object ($stream = $webClient.OpenRead($Url)) {
          $img = [System.Drawing.Image]::FromStream($stream)
            Using-Object ($memStream = New-Object System.IO.MemoryStream) {
            $img.Save($memStream, $img.RawFormat)
            $bytes = $memStream.toArray()
            $base64 = [System.Convert]::ToBase64String($bytes)
            return "data:image/jpeg;base64," + $base64
          }
        }
      } catch {
        $triesLeft = $MaxRetry - $i
        Write-Host "Failed to download image... Will try to download $triesLeft more times"
      } finally {
        if ($i -eq $MaxRetry) {
          Write-Host "Could not download image: $Url!"
          throw "Download not possible"
        }
      }
    }
  }
}

function Get-ImgurAlbum
{
  [CmdletBinding()]
  param (
    [Parameter(
      Mandatory = $true,
      ValueFromPipeline=$true
    )]
    [String] $Url,

    [Parameter()]
    [Switch] $DownloadImages,

    [Parameter()]
    [Int] $MaxRetry = 5
  )

  $response = Invoke-WebRequest $Url
  $runSlots = ($response.Content | select-string -Pattern "window.RunSlots\s*=\s*{[\s\S]*?item:\s*({[\s\S]*?})\s*};").Matches.Groups[1].Value
  $runSlots = ConvertFrom-Json -InputObject $runSlots -AsHashtable

  $album_title = $runSlots["title"]
  $images = $runSlots["album_images"]["images"]
  $totalImages = $images.Count
  Write-Host "Downloading $totalImages images from '$album_title'"

  $currentImage = 1

  foreach ($entry in $images) {
    $imgUrl = "https://i.imgur.com/" + $entry["hash"] + $entry["ext"]
    
    if ($DownloadImages) {
      Write-Host "Downloading image $currentImage of $totalImages"
      $currentImage += 1
      Start-Sleep -s 0.5
      $img = $imgUrl | Get-ImageWithRetries -MaxRetry $MaxRetry
      [PSCustomObject] @{
        description = $entry["description"]
        img = $img
        title = $entry["title"]
        album = $album_title
      }
    } else {
      [PSCustomObject] @{
        description = $entry["description"]
        img = $imgUrl
        title = $entry["title"]
        album = $album_title
      }
    }
  }
}

$urls = @(
  "https://imgur.com/gallery/IE53Z",
  "https://imgur.com/gallery/8zYdu",
  "https://imgur.com/gallery/5ssrM",
  "https://imgur.com/gallery/f5DNF",
  "https://imgur.com/gallery/PKhCd",
  "https://imgur.com/gallery/aY62m",
  "https://imgur.com/gallery/hu95I",
  "https://imgur.com/gallery/Z0UNC",
  "https://imgur.com/gallery/t9hOV",
  "https://imgur.com/gallery/pWtru",
  "https://imgur.com/gallery/kzTwu",
  "https://imgur.com/gallery/e05Lz",
  "https://imgur.com/gallery/GJbyK",
  "https://imgur.com/gallery/eSkgJ",
  "https://imgur.com/gallery/0CJjp",
  "https://imgur.com/gallery/uVYJg",
  "https://imgur.com/gallery/1EOza",
  "https://imgur.com/gallery/6fQ1P",
  "https://imgur.com/gallery/QLR5Z",
  "https://imgur.com/gallery/zrEdw",
  "https://imgur.com/gallery/r6A3K"
)

$albums = @()

foreach ($url in $urls) {
  $albums += Get-ImgurAlbum $url
}

ConvertTo-Json $albums | Set-Content -Path "blob/download_without_images.json"