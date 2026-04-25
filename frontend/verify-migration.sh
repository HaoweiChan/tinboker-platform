#!/bin/bash
# verify-migration.sh
# Verification script to check migration completeness

echo "=== Verifying Migration ==="
echo ""

# Check old files are deleted/updated
echo "1. Checking old mockData.ts..."
if [ -f "src/services/mockData.ts" ]; then
  echo "   ❌ ERROR: src/services/mockData.ts still exists!"
else
  echo "   ✅ src/services/mockData.ts removed"
fi

# Check new structure exists
echo ""
echo "2. Checking new mocks structure..."
if [ -d "src/services/mocks" ]; then
  echo "   ✅ src/services/mocks/ exists"
  file_count=$(find src/services/mocks -name "*.ts" | wc -l)
  echo "   ✅ Found $file_count mock files"
else
  echo "   ❌ ERROR: src/services/mocks/ does not exist!"
fi

# Check for old imports
echo ""
echo "3. Checking for old imports..."
old_imports=$(grep -r "from '@/services/mockData'" src/ 2>/dev/null | wc -l)
if [ "$old_imports" -eq 0 ]; then
  echo "   ✅ No old imports found"
else
  echo "   ❌ ERROR: Found $old_imports old imports!"
  grep -r "from '@/services/mockData'" src/ 2>/dev/null
fi

# Check for new imports
echo ""
echo "4. Checking for new imports..."
new_imports=$(grep -r "from '@/services/mocks'" src/ 2>/dev/null | wc -l)
if [ "$new_imports" -gt 0 ]; then
  echo "   ✅ Found $new_imports new imports"
else
  echo "   ⚠️  WARNING: No new imports found"
fi

# Check Zod schemas exist
echo ""
echo "5. Checking Zod schemas..."
if [ -f "src/validation/schemas.ts" ]; then
  echo "   ✅ src/validation/schemas.ts exists"
else
  echo "   ❌ ERROR: src/validation/schemas.ts does not exist!"
fi

# Check generated types exist
echo ""
echo "6. Checking generated types..."
if [ -f "src/api/generated/types.ts" ]; then
  echo "   ✅ src/api/generated/types.ts exists"
else
  echo "   ❌ ERROR: src/api/generated/types.ts does not exist!"
fi

# Field existence checks
echo ""
echo "=== Field Existence Verification ==="
echo ""

echo "7. Checking mockConcepts..."
if grep -q "export const mockConcepts" src/services/mocks/concepts.ts 2>/dev/null; then
  echo "   ✅ Found in src/services/mocks/concepts.ts"
else
  echo "   ❌ NOT FOUND in new location"
fi
if grep -q "export const mockConcepts" src/services/mockData.ts 2>/dev/null; then
  echo "   ❌ ERROR: Still exists in old location!"
else
  echo "   ✅ Removed from old location"
fi

echo ""
echo "8. Checking supplyChainEntities..."
if grep -q "supplyChainEntities" src/services/mocks/visualGraphs.ts 2>/dev/null; then
  echo "   ✅ Found in src/services/mocks/visualGraphs.ts"
else
  echo "   ❌ NOT FOUND in new location"
fi
if grep -q "supplyChainEntities" src/utils/graphUtils.ts 2>/dev/null; then
  echo "   ❌ ERROR: Still exists in old location!"
else
  echo "   ✅ Removed from old location"
fi

echo ""
echo "9. Checking generateMockPriceSeries..."
if grep -q "export const generateMockPriceSeries" src/services/mocks/priceSeries.ts 2>/dev/null; then
  echo "   ✅ Found in src/services/mocks/priceSeries.ts"
else
  echo "   ❌ NOT FOUND in new location"
fi
if grep -q "export const generateMockPriceSeries" src/utils/priceSeries.ts 2>/dev/null; then
  echo "   ⚠️  Still in priceSeries.ts (re-export, OK)"
else
  echo "   ✅ Removed from old location"
fi

echo ""
echo "10. Checking getSectorBubbleData..."
if grep -q "export const getSectorBubbleData" src/services/mocks/sectorData.ts 2>/dev/null; then
  echo "   ✅ Found in src/services/mocks/sectorData.ts"
else
  echo "   ❌ NOT FOUND in new location"
fi
if grep -q "export const getSectorBubbleData" src/utils/graphUtils.ts 2>/dev/null; then
  echo "   ⚠️  Still in graphUtils.ts (re-export, OK)"
else
  echo "   ✅ Removed from old location"
fi

echo ""
echo "11. Checking getSupplyChainData..."
if grep -q "export const getSupplyChainData" src/services/mocks/visualGraphs.ts 2>/dev/null; then
  echo "   ✅ Found in src/services/mocks/visualGraphs.ts"
else
  echo "   ❌ NOT FOUND in new location"
fi
if grep -q "export const getSupplyChainData" src/utils/graphUtils.ts 2>/dev/null; then
  echo "   ⚠️  Still in graphUtils.ts (re-export, OK)"
else
  echo "   ✅ Removed from old location"
fi

echo ""
echo "=== Verification Complete ==="

