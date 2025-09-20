<?php

namespace App\Support;

final class Http
{
    /**
     * Simple GET request using cURL.
     * @return array{code:int, body:string|null, error:string|null, ctype:string|null}
     */
    public static function get(string $url, int $connectTimeout = 3, int $timeout = 6): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => $connectTimeout,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_HTTPHEADER => [ 'Accept: application/json' ],
        ]);
        $body = curl_exec($ch);
        $err  = curl_error($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $ctype= curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        curl_close($ch);
        return [
            'code'  => $code,
            'body'  => ($body === false ? null : $body),
            'error' => ($err !== '' ? $err : null),
            'ctype' => ($ctype !== false ? (string)$ctype : null),
        ];
    }
}
