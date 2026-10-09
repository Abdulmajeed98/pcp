import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ErrorResponse } from '@pcp/core';

// The API's description of itself, built from the annotations on its
// endpoints and their Response classes. It is committed, and the frontends'
// client is generated from it, so an operation's name here is the name of the
// function a frontend calls.
export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Platform API')
    .setVersion('1')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .addGlobalResponse({
      status: 'default',
      description: 'The request was refused, or it failed.',
      type: ErrorResponse,
    })
    .build();

  return SwaggerModule.createDocument(app, config, {
    operationIdFactory: (_controllerKey, methodKey) => methodKey,
  });
}
