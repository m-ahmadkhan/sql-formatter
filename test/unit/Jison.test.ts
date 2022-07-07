import { Lexer, parser } from 'src/parser/grammar';

describe('Jison Parser', () => {
  const parse = (sql: string) => {
    const lexer = {
      yytext: '',
      index: 0,
      tokens: [] as string[],
      setInput(text: string) {
        this.tokens = text.split(/\s+/);
      },
      lex() {
        if (this.index >= this.tokens.length) {
          return 'EOF';
        }
        this.yytext = this.tokens[this.index];
        this.index++;
        if (['SELECT', 'FROM'].includes(this.yytext)) {
          return this.yytext;
        }
        if (/^[0-9]+$/.test(this.yytext)) {
          return 'NUMBER';
        }
        if (/^\w+$/.test(this.yytext)) {
          return 'IDENTIFIER';
        }
        if (this.yytext === '*') {
          return '*';
        }
        if (this.yytext === ';') {
          return ';';
        }
        return 'INVALID';
      },
    };
    parser.lexer = lexer as Lexer;
    return parser.parse(sql);
  };

  it('parses something', () => {
    expect(parse('SELECT * FROM my_table ; SELECT 42')).toEqual([
      {
        type: 'statement',
        children: [
          { type: 'keyword', value: 'SELECT' },
          { type: 'star' },
          { type: 'keyword', value: 'FROM' },
          { type: 'identifier', value: 'my_table' },
        ],
      },
      {
        type: 'statement',
        children: [
          { type: 'keyword', value: 'SELECT' },
          { type: 'number', value: '42' },
        ],
      },
    ]);
  });
});
