Error: P1012

error: Error validating field `account` in model `subscriptions`: The relation field `account` on model `subscriptions` is missing an opposite relation field on the model `accounts`. Either run `prisma format` or add it manually.
  -->  schema.prisma:68
   | 
67 |   vault        vaults   @relation(fields: [vault_id], references: [id], onDelete: Cascade)
68 |   account      accounts? @relation(fields: [account_id], references: [id], onDelete: SetNull)
69 |   member       members?  @relation(fields: [member_id], references: [id], onDelete: SetNull)
   | 
error: Error validating field `member` in model `subscriptions`: The relation field `member` on model `subscriptions` is missing an opposite relation field on the model `members`. Either run `prisma format` or add it manually.
  -->  schema.prisma:69
   | 
68 |   account      accounts? @relation(fields: [account_id], references: [id], onDelete: SetNull)
69 |   member       members?  @relation(fields: [member_id], references: [id], onDelete: SetNull)
70 | }
   | 
error: Error validating field `account` in model `investments`: The relation field `account` on model `investments` is missing an opposite relation field on the model `accounts`. Either run `prisma format` or add it manually.
  -->  schema.prisma:134
   | 
133 |   vault      vaults   @relation(fields: [vault_id], references: [id], onDelete: Cascade)
134 |   account    accounts? @relation(fields: [account_id], references: [id], onDelete: SetNull)
135 |   member     members?  @relation(fields: [member_id], references: [id], onDelete: SetNull)
   | 
error: Error validating field `member` in model `investments`: The relation field `member` on model `investments` is missing an opposite relation field on the model `members`. Either run `prisma format` or add it manually.
  -->  schema.prisma:135
   | 
134 |   account    accounts? @relation(fields: [account_id], references: [id], onDelete: SetNull)
135 |   member     members?  @relation(fields: [member_id], references: [id], onDelete: SetNull)
136 | }
   | 


