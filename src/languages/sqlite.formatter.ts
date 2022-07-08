import Formatter from 'src/formatter/Formatter';
import Tokenizer from 'src/lexer/Tokenizer';
import { dedupe } from 'src/utils';

const reservedFunctions = {
  // https://www.sqlite.org/lang_corefunc.html
  scalar: [
    'ABS',
    'CHANGES',
    'CHAR',
    'COALESCE',
    'FORMAT',
    'GLOB',
    'HEX',
    'IFNULL',
    'IIF',
    'INSTR',
    'LAST_INSERT_ROWID',
    'LENGTH',
    'LIKE',
    'LIKELIHOOD',
    'LIKELY',
    'LOAD_EXTENSION',
    'LOWER',
    'LTRIM',
    'NULLIF',
    'PRINTF',
    'QUOTE',
    'RANDOM',
    'RANDOMBLOB',
    'REPLACE',
    'ROUND',
    'RTRIM',
    'SIGN',
    'SOUNDEX',
    'SQLITE_COMPILEOPTION_GET',
    'SQLITE_COMPILEOPTION_USED',
    'SQLITE_OFFSET',
    'SQLITE_SOURCE_ID',
    'SQLITE_VERSION',
    'SUBSTR',
    'SUBSTRING',
    'TOTAL_CHANGES',
    'TRIM',
    'TYPEOF',
    'UNICODE',
    'UNLIKELY',
    'UPPER',
    'ZEROBLOB',
  ],
  // https://www.sqlite.org/lang_aggfunc.html
  aggregate: ['AVG', 'COUNT', 'GROUP_CONCAT', 'MAX', 'MIN', 'SUM', 'TOTAL'],
  // https://www.sqlite.org/lang_datefunc.html
  datetime: ['DATE', 'TIME', 'DATETIME', 'JULIANDAY', 'UNIXEPOCH', 'STRFTIME'],
};

// https://www.sqlite.org/lang_keywords.html
const reservedKeywords = [
  'ABORT',
  'ACTION',
  'ADD',
  'AFTER',
  'ALL',
  'ALTER',
  // 'AND',
  'ANY',
  'ARE',
  'ARRAY',
  'ALWAYS',
  'ANALYZE',
  'AS',
  'ASC',
  'ATTACH',
  'AUTOINCREMENT',
  'BEFORE',
  'BEGIN',
  'BETWEEN',
  'BY',
  'CASCADE',
  'CASE',
  'CAST',
  'CHECK',
  'COLLATE',
  'COLUMN',
  'COMMIT',
  'CONFLICT',
  'CONSTRAINT',
  'CREATE',
  'CROSS',
  'CURRENT',
  'CURRENT_DATE',
  'CURRENT_TIME',
  'CURRENT_TIMESTAMP',
  'DATABASE',
  'DEFAULT',
  'DEFERRABLE',
  'DEFERRED',
  'DELETE',
  'DESC',
  'DETACH',
  'DISTINCT',
  'DO',
  'DROP',
  'EACH',
  'ELSE',
  'END',
  'ESCAPE',
  'EXCEPT',
  'EXCLUDE',
  'EXCLUSIVE',
  'EXISTS',
  'EXPLAIN',
  'FAIL',
  'FILTER',
  'FIRST',
  'FOLLOWING',
  'FOR',
  'FOREIGN',
  'FROM',
  'FULL',
  'GENERATED',
  'GLOB',
  'GROUP',
  'GROUPS',
  'HAVING',
  'IF',
  'IGNORE',
  'IMMEDIATE',
  'IN',
  'INDEX',
  'INDEXED',
  'INITIALLY',
  'INNER',
  'INSERT',
  'INSTEAD',
  'INTERSECT',
  'INTO',
  'IS',
  'ISNULL',
  'JOIN',
  'KEY',
  'LAST',
  'LEFT',
  'LIKE',
  'LIMIT',
  'MATCH',
  'MATERIALIZED',
  'NATURAL',
  'NO',
  'NOT',
  'NOTHING',
  'NOTNULL',
  'NULL',
  'NULLS',
  'OF',
  'OFFSET',
  'ON DELETE',
  'ON UPDATE',
  'ONLY',
  'OPEN',
  // 'OR',
  'ORDER',
  'OTHERS',
  'OUTER',
  'OVER',
  'PARTITION',
  'PLAN',
  'PRAGMA',
  'PRECEDING',
  'PRIMARY',
  'QUERY',
  'RAISE',
  'RANGE',
  'RECURSIVE',
  'REFERENCES',
  'REGEXP',
  'REINDEX',
  'RELEASE',
  'RENAME',
  'REPLACE',
  'RESTRICT',
  'RETURNING',
  'RIGHT',
  'ROLLBACK',
  'ROW',
  'ROWS',
  'SAVEPOINT',
  'SELECT',
  'SET',
  'TABLE',
  'TEMP',
  'TEMPORARY',
  'THEN',
  'TIES',
  'TO',
  'TRANSACTION',
  'TRIGGER',
  'UNBOUNDED',
  'UNION',
  'UNIQUE',
  'UPDATE',
  'USING',
  'VACUUM',
  'VALUES',
  'VIEW',
  'VIRTUAL',
  'WHEN',
  'WHERE',
  'WINDOW',
  'WITH',
  'WITHOUT',
];

const reservedCommands = [
  'ADD',
  'ALTER COLUMN',
  'ALTER TABLE',
  'CREATE TABLE',
  'DROP TABLE',
  'DELETE',
  'DELETE FROM',
  'FETCH FIRST',
  'FETCH NEXT',
  'FETCH PRIOR',
  'FETCH LAST',
  'FETCH ABSOLUTE',
  'FETCH RELATIVE',
  'FROM',
  'GROUP BY',
  'HAVING',
  'INSERT INTO',
  'LIMIT',
  'OFFSET',
  'ORDER BY',
  'SELECT',
  'SET SCHEMA',
  'SET',
  'UPDATE',
  'VALUES',
  'WHERE',
  'WITH',
];

const reservedBinaryCommands = [
  'INTERSECT',
  'INTERSECT ALL',
  'INTERSECT DISTINCT',
  'UNION',
  'UNION ALL',
  'UNION DISTINCT',
  'EXCEPT',
  'EXCEPT ALL',
  'EXCEPT DISTINCT',
];

// joins - https://www.sqlite.org/syntax/join-operator.html
const reservedJoins = [
  'JOIN',
  'LEFT JOIN',
  'LEFT OUTER JOIN',
  'INNER JOIN',
  'CROSS JOIN',
  'NATURAL JOIN',
  'NATURAL LEFT JOIN',
  'NATURAL LEFT OUTER JOIN',
  'NATURAL INNER JOIN',
  'NATURAL CROSS JOIN',
];

const reservedDependentClauses = ['WHEN', 'ELSE'];

export default class SqliteFormatter extends Formatter {
  // https://www.sqlite.org/lang_expr.html
  static operators = ['~', '->', '->>', '||', '<<', '>>', '=='];

  tokenizer() {
    return new Tokenizer({
      reservedCommands,
      reservedBinaryCommands,
      reservedJoins,
      reservedDependentClauses,
      reservedKeywords: dedupe([...reservedKeywords, ...Object.values(reservedFunctions).flat()]),
      stringTypes: [{ quote: "''", prefixes: ['X'] }],
      identTypes: [`""`, '``', '[]'],
      // https://www.sqlite.org/lang_expr.html#parameters
      positionalParams: true,
      numberedParamTypes: ['?'],
      namedParamTypes: [':', '@', '$'],
      operators: SqliteFormatter.operators,
    });
  }
}
