param(
  [Parameter(Position = 0)]
  [ValidateSet('infra', 'api', 'customer', 'merchant', 'frontend', 'all')]
  [string] $Target = 'all',

  [Alias('d')]
  [switch] $Detached
)

$servicesByTarget = @{
  infra = @('postgres', 'redis', 'rabbitmq', 'minio')
  api = @('postgres', 'redis', 'rabbitmq', 'minio', 'lb-api')
  customer = @('lb-customer')
  merchant = @('lb-merchant')
  frontend = @('lb-customer', 'lb-merchant')
  all = @('postgres', 'redis', 'rabbitmq', 'minio', 'lb-api', 'lb-customer', 'lb-merchant')
}

$services = $servicesByTarget[$Target]
$repoRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $repoRoot 'docker/dev/.env'

if (-not (Test-Path $envFile)) {
  $exampleEnvFile = Join-Path $repoRoot 'docker/dev/.env.example'
  Copy-Item $exampleEnvFile $envFile
  Write-Host "Created docker/dev/.env from docker/dev/.env.example. Review it if you need different local credentials."
}

$composeBaseArgs = @('compose', '--env-file', $envFile)
$composeArgs = $composeBaseArgs + @('up', '--build')

if ($Detached) {
  $composeArgs += '-d'
}

$composeArgs += $services

Write-Host "Starting LastBite local dev target '$Target': $($services -join ', ')"

Push-Location $repoRoot
try {
  if ($Target -eq 'api') {
    $infraArgs = $composeBaseArgs + @('up', '--build', '-d', 'postgres', 'redis', 'rabbitmq', 'minio')
    docker @infraArgs

    $apiArgs = $composeBaseArgs + @('up', '--build', '--force-recreate', '--no-deps')

    if ($Detached) {
      $apiArgs += '-d'
    }

    $apiArgs += 'lb-api'
    docker @apiArgs
  }
  else {
    docker @composeArgs
  }
}
finally {
  Pop-Location
}
