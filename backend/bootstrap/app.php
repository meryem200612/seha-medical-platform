<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Database\QueryException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (QueryException|\PDOException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                report($e);

                return response()->json([
                    'message' => 'Database error. Please try again later.',
                ], 500);
            }
        });

        $exceptions->render(function (\Throwable $e, $request) {
            if (($request->expectsJson() || $request->is('api/*')) && app()->isProduction()) {
                report($e);

                return response()->json([
                    'message' => 'Server Error',
                ], 500);
            }
        });
    })->create();
