import { describe, it, expect } from 'vitest';
import { PlaybackState, RepeatMode, ThemeSkin, AudioSourceType } from './index';

describe('Enums do Domínio de Reprodução e Temas', () => {
  it('deve possuir todos os estados de reprodução esperados', () => {
    expect(PlaybackState.IDLE).toBe('IDLE');
    expect(PlaybackState.LOADING).toBe('LOADING');
    expect(PlaybackState.PLAYING).toBe('PLAYING');
    expect(PlaybackState.PAUSED).toBe('PAUSED');
    expect(PlaybackState.ERROR).toBe('ERROR');
  });

  it('deve conter as skins retrô anos 2000 e modernas', () => {
    expect(ThemeSkin.WMP_CLASSIC_2000).toBe('WMP_CLASSIC_2000');
    expect(ThemeSkin.WINAMP_RETRO).toBe('WINAMP_RETRO');
    expect(ThemeSkin.FRUTIGER_AERO).toBe('FRUTIGER_AERO');
    expect(ThemeSkin.MODERN_MINIMAL).toBe('MODERN_MINIMAL');
  });

  it('deve mapear os tipos de fonte de áudio corretamente', () => {
    expect(AudioSourceType.YOUTUBE_STREAM).toBe('YOUTUBE_STREAM');
    expect(AudioSourceType.OFFLINE_STORAGE).toBe('OFFLINE_STORAGE');
    expect(AudioSourceType.LOCAL_DEVICE_FILE).toBe('LOCAL_DEVICE_FILE');
  });
});
