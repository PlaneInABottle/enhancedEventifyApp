#!/bin/bash
# Project-Specific Hook - React Native Development Guide

HOOK_DATA=$(cat)

echo "📱 REACT NATIVE PATTERNS:"
echo "  □ Use functional components with observer wrapper"
echo "  □ Apply useAppTheme() for consistent styling"
echo "  □ Use translation keys only (tx prop)"
echo "  □ Wrap FlatList items with Observer for MobX reactivity"
echo ""
echo "🚀 QUALITY GATES:"
echo "  □ Use code-reviewer for changes, testing-strategist before features"

exit 0