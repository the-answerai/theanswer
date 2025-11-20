/**
 * Custom ESLint Rules for Theme Pattern Enforcement
 * Enforces glassmorphism and CSS Variables patterns
 *
 * Usage in .eslintrc:
 * {
 *   "plugins": ["./theme-rules"],
 *   "rules": {
 *     "theme-rules/no-direct-palette": "warn",
 *     "theme-rules/no-common-color": "warn",
 *     "theme-rules/enforce-glass-pattern": "warn"
 *   }
 * }
 */

module.exports = {
    rules: {
        /**
         * Rule: Prevent direct theme.palette access
         * Suggest using theme.vars.palette instead
         */
        'no-direct-palette': {
            meta: {
                type: 'suggestion',
                docs: {
                    description: 'Prevent direct theme.palette access; use theme.vars.palette for CSS Variables support',
                    category: 'Theme Patterns',
                    recommended: true
                },
                messages: {
                    directPalette:
                        'Direct theme.palette access detected. Use theme.vars.palette for CSS Variables support and consistent theming.'
                }
            },
            create(context) {
                return {
                    MemberExpression(node) {
                        // Check for theme.palette pattern
                        if (
                            node.object.type === 'MemberExpression' &&
                            node.object.object.name === 'theme' &&
                            node.object.property.name === 'palette'
                        ) {
                            // Allow if accessing vars (theme.vars.palette)
                            if (node.object.object.property && node.object.object.property.name === 'vars') {
                                return
                            }

                            context.report({
                                node,
                                messageId: 'directPalette',
                                fix(fixer) {
                                    // Simple fix: replace theme.palette with theme.vars.palette
                                    const sourceCode = context.getSourceCode()
                                    const text = sourceCode.getText(node)

                                    if (text.includes('theme.palette')) {
                                        return fixer.replaceText(node, text.replace('theme.palette', 'theme.vars.palette'))
                                    }

                                    return null
                                }
                            })
                        }
                    }
                }
            }
        },

        /**
         * Rule: Prevent theme.palette.common access
         * Suggest using explicit color values
         */
        'no-common-color': {
            meta: {
                type: 'suggestion',
                docs: {
                    description: 'Prevent use of theme.palette.common; use explicit color values instead',
                    category: 'Theme Patterns',
                    recommended: true
                },
                messages: {
                    commonColor:
                        'theme.palette.common is deprecated. Use explicit color values (e.g., "#ffffff" or "rgba(255,255,255,0.8)") instead.'
                }
            },
            create(context) {
                return {
                    MemberExpression(node) {
                        // Check for palette.common pattern
                        if (node.object?.property?.name === 'common' && node.object.object?.property?.name === 'palette') {
                            context.report({
                                node,
                                messageId: 'commonColor'
                            })
                        }
                    }
                }
            }
        },

        /**
         * Rule: Enforce glassmorphism pattern usage
         * Encourage use of glass tokens for consistency
         */
        'enforce-glass-pattern': {
            meta: {
                type: 'suggestion',
                docs: {
                    description: 'Encourage use of glassmorphism tokens from theme.vars.glass',
                    category: 'Theme Patterns',
                    recommended: false
                },
                messages: {
                    useGlassTokens: 'Consider using glassmorphism tokens (theme.vars.glass) for glass effect components'
                }
            },
            create(context) {
                return {
                    // Check for backdrop filter usage outside of glass tokens
                    VariableDeclarator(node) {
                        if (node.init?.properties) {
                            const hasBackdropFilter = node.init.properties.some(
                                (p) => p.key?.name === 'backdropFilter' || p.key?.value === 'backdropFilter'
                            )

                            if (hasBackdropFilter) {
                                context.report({
                                    node,
                                    messageId: 'useGlassTokens'
                                })
                            }
                        }
                    }
                }
            }
        },

        /**
         * Rule: Warn on deprecated useTheme without CSS Variables
         * Suggest using sx prop or theme.vars directly
         */
        'deprecate-use-theme': {
            meta: {
                type: 'suggestion',
                docs: {
                    description: 'Discourage useTheme() without CSS Variables awareness',
                    category: 'Theme Patterns',
                    recommended: false
                },
                messages: {
                    useThemeWarning:
                        'useTheme() may bypass CSS Variables. Consider using the sx prop with a theme function instead: sx={(theme) => ({ color: theme.vars.palette.text.primary })}'
                }
            },
            create(context) {
                return {
                    CallExpression(node) {
                        if (node.callee?.name === 'useTheme') {
                            context.report({
                                node,
                                messageId: 'useThemeWarning'
                            })
                        }
                    }
                }
            }
        }
    }
}
