#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PASS=0
FAIL=0
MISSING=0

print_result() {
  local label="$1"
  local status="$2"
  case "$status" in
    PASS)    printf "  \033[32mPASS\033[0m    %s\n" "$label"; PASS=$((PASS + 1)) ;;
    FAIL)    printf "  \033[31mFAIL\033[0m    %s\n" "$label"; FAIL=$((FAIL + 1)) ;;
    MISSING) printf "  \033[33mMISSING\033[0m %s\n" "$label"; MISSING=$((MISSING + 1)) ;;
  esac
}

echo ""
echo "=========================================="
echo "  Auto-Teleprompter Verification"
echo "=========================================="
echo ""

# --- Toolchain checks ---
echo "--- Toolchain ---"

if npx tsc --noEmit 2>/dev/null; then
  print_result "TypeScript compiles" "PASS"
else
  print_result "TypeScript compiles" "FAIL"
fi

if npm run lint --silent 2>/dev/null; then
  print_result "ESLint passes" "PASS"
else
  print_result "ESLint passes" "FAIL"
fi

if npx vitest run --silent 2>/dev/null; then
  print_result "Tests pass" "PASS"
else
  print_result "Tests pass" "FAIL"
fi

echo ""

# --- Phase 0: Foundation + TypeScript Migration ---
echo "--- Phase 0: Foundation + TypeScript Migration ---"

phase0_files=(
  "tsconfig.json"
  "vite.config.ts"
  "src/main.tsx"
  "src/App.tsx"
  "src/components/ScriptEditor.tsx"
  "src/components/Teleprompter.tsx"
  "src/types/index.ts"
  "src/contexts/ScriptContext.tsx"
  "src/contexts/SessionContext.tsx"
  "src/utils/scriptMigration.ts"
  "vitest.config.ts"
  "src/test/setup.ts"
  "src/index.css"
  "scripts/verify.sh"
)

for f in "${phase0_files[@]}"; do
  if [ -f "$f" ]; then
    print_result "$f" "PASS"
  else
    print_result "$f" "MISSING"
  fi
done

# Check phase 0 directories
phase0_dirs=(
  "src/hooks"
  "src/utils"
  "src/contexts"
  "src/types"
  "src/constants"
)

for d in "${phase0_dirs[@]}"; do
  if [ -d "$d" ]; then
    print_result "$d/" "PASS"
  else
    print_result "$d/" "MISSING"
  fi
done

echo ""

# --- Phase 1a: Voice Recognition Foundation ---
echo "--- Phase 1a: Voice Recognition Foundation ---"

phase1a_files=(
  "src/hooks/useSpeechRecognition.ts"
  "src/utils/voiceMatch.ts"
  "src/__tests__/voiceMatch.test.ts"
  "src/components/SpeechDebugOverlay.tsx"
)

for f in "${phase1a_files[@]}"; do
  if [ -f "$f" ]; then
    print_result "$f" "PASS"
  else
    print_result "$f" "MISSING"
  fi
done

echo ""

# --- Phase 1b: Voice-Driven Scroll Integration ---
echo "--- Phase 1b: Voice-Driven Scroll Integration ---"

phase1b_files=(
  "src/hooks/useVoiceScroll.ts"
  "src/hooks/useScrollEngine.ts"
)

for f in "${phase1b_files[@]}"; do
  if [ -f "$f" ]; then
    print_result "$f" "PASS"
  else
    print_result "$f" "MISSING"
  fi
done

echo ""

# --- Phase 2a: Script Management + Multi-Speaker ---
echo "--- Phase 2a: Script Management + Multi-Speaker ---"

phase2a_files=(
  "src/hooks/useSpeakers.ts"
  "src/components/SpeakerManager.tsx"
  "src/hooks/useScriptStorage.ts"
  "src/components/ScriptRenderer.tsx"
)

for f in "${phase2a_files[@]}"; do
  if [ -f "$f" ]; then
    print_result "$f" "PASS"
  else
    print_result "$f" "MISSING"
  fi
done

echo ""

# --- Phase 2b: Responsive Design ---
echo "--- Phase 2b: Responsive Design ---"

phase2b_files=(
  "src/constants/colors.ts"
)

for f in "${phase2b_files[@]}"; do
  if [ -f "$f" ]; then
    print_result "$f" "PASS"
  else
    print_result "$f" "MISSING"
  fi
done

echo ""

# --- Phase 3: Polish and Integration ---
echo "--- Phase 3: Polish and Integration ---"

phase3_files=(
  "src/components/OnboardingOverlay.tsx"
  "public/manifest.json"
  "public/sw.js"
)

for f in "${phase3_files[@]}"; do
  if [ -f "$f" ]; then
    print_result "$f" "PASS"
  else
    print_result "$f" "MISSING"
  fi
done

echo ""
echo "=========================================="
printf "  Results: \033[32m%d PASS\033[0m / \033[31m%d FAIL\033[0m / \033[33m%d MISSING\033[0m\n" "$PASS" "$FAIL" "$MISSING"
echo "=========================================="
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

exit 0
