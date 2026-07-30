/**
 * Babel plugin that replaces dynamic import() calls that use a non-literal
 * (variable/identifier) argument with Promise.resolve({}).
 *
 * This fixes Hermes production build crashes caused by:
 *   import(OTEL_PKG)  ← used by @supabase/realtime-js OpenTelemetry integration
 *
 * Hermes can handle static import("string") but NOT import(variable).
 */
module.exports = function ({ types: t }) {
  return {
    name: 'strip-dynamic-variable-import',
    visitor: {
      CallExpression(path) {
        if (
          path.node.callee.type === 'Import' &&
          path.node.arguments.length > 0 &&
          path.node.arguments[0].type !== 'StringLiteral' &&
          path.node.arguments[0].type !== 'TemplateLiteral'
        ) {
          // Replace import(variable) → Promise.resolve({})
          path.replaceWith(
            t.callExpression(
              t.memberExpression(t.identifier('Promise'), t.identifier('resolve')),
              [t.objectExpression([])]
            )
          );
        }
      },
    },
  };
};
