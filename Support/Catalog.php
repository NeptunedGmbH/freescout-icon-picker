<?php

namespace Modules\IconPicker\Support;

/**
 * Liest die mitgelieferten Kataloge und lässt nur Werte daraus zu.
 */
class Catalog
{
    /**
     * @param string $directory
     * @return array{glyphs:array,aliases:array,lucide:array,emoji:array}
     */
    public static function read($directory)
    {
        return array(
            'glyphs' => self::json($directory.'/glyphs.json', array()),
            'aliases' => self::json($directory.'/aliases.json', array()),
            'lucide' => self::json($directory.'/lucide.json', array()),
            'emoji' => self::json($directory.'/emoji.json', array()),
        );
    }

    /**
     * @param string $kind
     * @param string $value
     * @param array $catalog
     * @return array|null kind and value, or null when rejected
     */
    public static function accept($kind, $value, array $catalog)
    {
        $kind = (string) $kind;
        $value = (string) $value;
        if ($value === '' || self::markup($value) || self::markup($kind)) {
            return null;
        }

        if ($kind === 'glyph') {
            $name = self::glyphName($value, $catalog);
            if ($name === null) {
                return null;
            }

            return array('kind' => 'glyph', 'value' => $name);
        }

        if ($kind === 'lucide') {
            $icons = isset($catalog['lucide']) && is_array($catalog['lucide']) ? $catalog['lucide'] : array();
            if (!isset($icons[$value]) || !is_string($icons[$value]) || $icons[$value] === '') {
                return null;
            }

            return array('kind' => 'lucide', 'value' => $value);
        }

        if ($kind === 'emoji') {
            $list = isset($catalog['emoji']) && is_array($catalog['emoji']) ? $catalog['emoji'] : array();
            foreach ($list as $row) {
                if (is_array($row) && isset($row['char']) && (string) $row['char'] === $value) {
                    return array('kind' => 'emoji', 'value' => $value);
                }
            }

            return null;
        }

        return null;
    }

    /**
     * @param array $copy
     * @param array $live
     * @return bool
     */
    public static function sameGlyphs(array $copy, array $live)
    {
        $left = array();
        $right = array();
        foreach ($copy as $name) {
            if (is_string($name) && $name !== '') {
                $left[] = $name;
            }
        }
        foreach ($live as $name) {
            if (is_string($name) && $name !== '') {
                $right[] = $name;
            }
        }
        sort($left);
        sort($right);

        return $left === $right;
    }

    /**
     * @param string $value
     * @param array $catalog
     * @return string|null
     */
    private static function glyphName($value, array $catalog)
    {
        $glyphs = isset($catalog['glyphs']) && is_array($catalog['glyphs']) ? $catalog['glyphs'] : array();
        if (in_array($value, $glyphs, true)) {
            return $value;
        }
        $aliases = isset($catalog['aliases']) && is_array($catalog['aliases']) ? $catalog['aliases'] : array();
        if (isset($aliases[$value]) && is_string($aliases[$value]) && in_array($aliases[$value], $glyphs, true)) {
            return $aliases[$value];
        }

        return null;
    }

    /**
     * @param string $value
     * @return bool
     */
    private static function markup($value)
    {
        return strpbrk($value, "<>&\"'") !== false;
    }

    /**
     * @param string $path
     * @param array $fallback
     * @return array
     */
    private static function json($path, array $fallback)
    {
        if (!is_file($path) || !is_readable($path)) {
            return $fallback;
        }
        $decoded = json_decode((string) file_get_contents($path), true);

        return is_array($decoded) ? $decoded : $fallback;
    }
}
