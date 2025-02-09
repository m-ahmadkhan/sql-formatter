/* eslint-disable no-cond-assign */
import { EOF_TOKEN, type Token, TokenType, isToken } from 'src/lexer/token';
import {
  AllColumnsAsterisk,
  ArraySubscript,
  AstNode,
  BetweenPredicate,
  SetOperation,
  Clause,
  FunctionCall,
  LimitClause,
  NodeType,
  Parenthesis,
  Statement,
  TokenNode,
} from './ast';

/**
 * A simple parser that creates a very rudimentary syntax tree.
 */
export default class Parser {
  private index = 0;

  constructor(private tokens: Token[]) {}

  public parse(): Statement[] {
    const statements: Statement[] = [];
    let stat: Statement | undefined;
    while ((stat = this.statement())) {
      statements.push(stat);
    }
    return statements;
  }

  private statement(): Statement | undefined {
    const children: AstNode[] = [];
    while (true) {
      if (this.look().type === TokenType.DELIMITER) {
        this.next();
        return { type: NodeType.statement, children, hasSemicolon: true };
      } else if (this.look().type === TokenType.EOF) {
        if (children.length > 0) {
          return { type: NodeType.statement, children, hasSemicolon: false };
        } else {
          return undefined;
        }
      } else {
        children.push(this.expression());
      }
    }
  }

  private expression(): AstNode {
    return (
      this.limitClause() ||
      this.clause() ||
      this.setOperation() ||
      this.functionCall() ||
      this.arraySubscript() ||
      this.parenthesis() ||
      this.betweenPredicate() ||
      this.allColumnsAsterisk() ||
      this.nextTokenNode()
    );
  }

  private clause(): Clause | undefined {
    if (this.look().type === TokenType.RESERVED_COMMAND) {
      const name = this.next();
      const children = this.expressionsUntilClauseEnd();
      return { type: NodeType.clause, nameToken: name, children };
    }
    return undefined;
  }

  private setOperation(): SetOperation | undefined {
    if (this.look().type === TokenType.RESERVED_SET_OPERATION) {
      const name = this.next();
      const children = this.expressionsUntilClauseEnd();
      return { type: NodeType.set_operation, nameToken: name, children };
    }
    return undefined;
  }

  private functionCall(): FunctionCall | undefined {
    if (this.look().type === TokenType.RESERVED_FUNCTION_NAME && this.look(1).text === '(') {
      return {
        type: NodeType.function_call,
        nameToken: this.next(),
        parenthesis: this.parenthesis() as Parenthesis,
      };
    }
    return undefined;
  }

  private arraySubscript(): ArraySubscript | undefined {
    if (
      (this.look().type === TokenType.RESERVED_KEYWORD ||
        this.look().type === TokenType.IDENTIFIER) &&
      this.look(1).text === '['
    ) {
      return {
        type: NodeType.array_subscript,
        arrayToken: this.next(),
        parenthesis: this.parenthesis() as Parenthesis,
      };
    }
    return undefined;
  }

  private parenthesis(): Parenthesis | undefined {
    if (this.look().type === TokenType.OPEN_PAREN) {
      const children: AstNode[] = [];
      const token = this.next();
      const openParen = token.text;
      let closeParen = '';
      while (this.look().type !== TokenType.CLOSE_PAREN && this.look().type !== TokenType.EOF) {
        children.push(this.expression());
      }
      if (this.look().type === TokenType.CLOSE_PAREN) {
        closeParen = this.next().text;
      }
      return { type: NodeType.parenthesis, children, openParen, closeParen };
    }
    return undefined;
  }

  private betweenPredicate(): BetweenPredicate | undefined {
    if (isToken.BETWEEN(this.look()) && isToken.AND(this.look(2))) {
      return {
        type: NodeType.between_predicate,
        betweenToken: this.next(),
        expr1: this.next(),
        andToken: this.next(),
        expr2: this.next(),
      };
    }
    return undefined;
  }

  private limitClause(): LimitClause | undefined {
    if (isToken.LIMIT(this.look())) {
      const limitToken = this.next();
      const expr1 = this.expressionsUntilClauseEnd(t => t.type === TokenType.COMMA);
      if (this.look().type === TokenType.COMMA) {
        this.next(); // Discard comma token
        const expr2 = this.expressionsUntilClauseEnd();
        return {
          type: NodeType.limit_clause,
          limitToken,
          offset: expr1,
          count: expr2,
        };
      } else {
        return {
          type: NodeType.limit_clause,
          limitToken,
          count: expr1,
        };
      }
    }
    return undefined;
  }

  private allColumnsAsterisk(): AllColumnsAsterisk | undefined {
    if (this.look().text === '*' && isToken.SELECT(this.look(-1))) {
      this.next();
      return { type: NodeType.all_columns_asterisk };
    }
    return undefined;
  }

  private expressionsUntilClauseEnd(
    extraPredicate: (token: Token) => boolean = () => false
  ): AstNode[] {
    const children: AstNode[] = [];
    while (
      this.look().type !== TokenType.RESERVED_COMMAND &&
      this.look().type !== TokenType.RESERVED_SET_OPERATION &&
      this.look().type !== TokenType.EOF &&
      this.look().type !== TokenType.CLOSE_PAREN &&
      this.look().type !== TokenType.DELIMITER &&
      !extraPredicate(this.look())
    ) {
      children.push(this.expression());
    }
    return children;
  }

  // Returns current token without advancing the pointer
  private look(ahead = 0): Token {
    return this.tokens[this.index + ahead] || EOF_TOKEN;
  }

  // Returns current token and advances the pointer to next token
  private next(): Token {
    return this.tokens[this.index++] || EOF_TOKEN;
  }

  private nextTokenNode(): TokenNode {
    return { type: NodeType.token, token: this.next() };
  }
}
